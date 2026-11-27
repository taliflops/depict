import { beforeEach, describe, expect, it, vi } from 'vitest'

const query = vi.fn()

vi.mock('pg', () => ({
  Pool: vi.fn(function Pool() {
    return { query }
  }),
}))

// lib/db caches the pool and the schema promise at module level, so each
// test loads a fresh copy of the module.
async function loadDb() {
  delete (globalThis as { pgPool?: unknown }).pgPool
  vi.resetModules()
  return import('./db')
}

const row = {
  id: '1',
  prompt: 'hello',
  model: 'claude-opus-5-5',
  url: 'https://example.com',
  created_at: new Date('2026-01-01T00:00:00Z'),
}

beforeEach(() => {
  query.mockReset()
})

describe('savePromptRun', () => {
  it('creates the table, then inserts the run and returns the stored row', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [row] })
    const { savePromptRun } = await loadDb()

    const result = await savePromptRun({
      prompt: 'hello',
      model: 'claude-opus-5-5',
      url: 'https://example.com',
    })

    expect(result).toEqual(row)
    expect(query).toHaveBeenCalledTimes(2)
    expect(query.mock.calls[0][0]).toContain(
      'CREATE TABLE IF NOT EXISTS prompt_runs',
    )
    expect(query.mock.calls[1][0]).toContain('INSERT INTO prompt_runs')
    expect(query.mock.calls[1][1]).toEqual([
      'hello',
      'claude-opus-5-5',
      'https://example.com',
    ])
  })

  it('creates the table only once across several saves', async () => {
    query.mockResolvedValue({ rows: [row] })
    const { savePromptRun } = await loadDb()

    await savePromptRun({ prompt: 'a', model: 'm', url: 'u' })
    await savePromptRun({ prompt: 'b', model: 'm', url: 'u' })

    const createCalls = query.mock.calls.filter(([sql]) =>
      String(sql).includes('CREATE TABLE'),
    )
    expect(createCalls).toHaveLength(1)
    expect(query).toHaveBeenCalledTimes(3)
  })

  it('retries creating the table after a failed attempt', async () => {
    query
      .mockRejectedValueOnce(new Error('connection refused'))
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [row] })
    const { savePromptRun } = await loadDb()

    await expect(
      savePromptRun({ prompt: 'a', model: 'm', url: 'u' }),
    ).rejects.toThrow('connection refused')

    await expect(
      savePromptRun({ prompt: 'a', model: 'm', url: 'u' }),
    ).resolves.toEqual(row)
    expect(query.mock.calls[1][0]).toContain('CREATE TABLE')
  })

  it('reuses the pool stored on globalThis outside production', async () => {
    const { pool } = await loadDb()

    expect((globalThis as { pgPool?: unknown }).pgPool).toBe(pool)
  })
})
