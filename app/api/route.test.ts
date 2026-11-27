import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { savePromptRun } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  savePromptRun: vi.fn(),
}))

const fetchMock = vi.fn()

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockPage(html: string) {
  fetchMock.mockResolvedValue(new Response(html))
}

beforeEach(() => {
  vi.mocked(savePromptRun).mockReset().mockResolvedValue({
    id: '1',
    prompt: 'p',
    model: 'claude-opus-5-5',
    url: 'https://example.com',
    created_at: new Date(),
  })
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

describe('POST /api', () => {
  it('prefixes https:// when the url has no scheme', async () => {
    mockPage('<html></html>')

    await POST(postRequest({ prompt: 'hello', url: 'example.com' }))

    expect(fetchMock).toHaveBeenCalledWith('https://example.com', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    expect(savePromptRun).toHaveBeenCalledWith({
      prompt: 'hello',
      model: 'claude-opus-5-5',
      url: 'https://example.com',
    })
  })

  it('keeps a url that already starts with https://', async () => {
    mockPage('<html></html>')

    await POST(postRequest({ prompt: 'hello', url: 'https://example.com/page' }))

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/page',
      expect.anything(),
    )
    expect(savePromptRun).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://example.com/page' }),
    )
  })

  it('saves the prompt run before scraping the page', async () => {
    mockPage('<html></html>')

    await POST(postRequest({ prompt: 'hello', url: 'example.com' }))

    expect(vi.mocked(savePromptRun).mock.invocationCallOrder[0]).toBeLessThan(
      fetchMock.mock.invocationCallOrder[0],
    )
  })

  it('returns "Confirmed" with status 201 when the page contains a response text', async () => {
    mockPage('<h1>Shoppa Nike Black Friday Days</h1>')

    const res = await POST(postRequest({ prompt: 'hello', url: 'nike.com' }))

    expect(res.status).toBe(201)
    expect(await res.json()).toBe('Confirmed')
  })

  it('returns "Confirmed" when only one of several response texts matches', async () => {
    mockPage('<p>Google offered in: English</p>')

    const res = await POST(postRequest({ prompt: 'hello', url: 'google.com' }))

    expect(await res.json()).toBe('Confirmed')
  })

  it('returns "Inconclusive" with status 201 when no response text is on the page', async () => {
    mockPage('<p>Nothing relevant here</p>')

    const res = await POST(postRequest({ prompt: 'hello', url: 'example.com' }))

    expect(res.status).toBe(201)
    expect(await res.json()).toBe('Inconclusive')
  })

  it('rejects when saving the prompt run fails, without scraping', async () => {
    vi.mocked(savePromptRun).mockRejectedValue(new Error('db down'))

    await expect(
      POST(postRequest({ prompt: 'hello', url: 'example.com' })),
    ).rejects.toThrow('db down')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects when the page cannot be fetched', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    await expect(
      POST(postRequest({ prompt: 'hello', url: 'example.com' })),
    ).rejects.toThrow('fetch failed')
  })
})
