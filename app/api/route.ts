import { NextRequest, NextResponse } from 'next/server'
import { savePromptRun } from '@/lib/db'
// import { Anthropic } from '@anthropic-ai/sdk/client.js';

// const client = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// });

  const messages = {
    id: "msg_01XFDUDYJgAACzvnptvVoYEL",
    type: "message",
    role: "assistant",
    model: "claude-opus-5-5",
    content: [
      {
        type: "text",
        text: "Shoppa Nike Black Friday Days",
        citations: null
      },
      {
        type: "text",
        text: "Build, create, and do more with AI tools from Google",
        citations: null
      },
      {
        type: "text",
        text: "Google offered in",
        citations: null
      },
    ],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: {
      input_tokens: 10,
      output_tokens: 12,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      service_tier: "standard"
    }
  }

export async function POST(req: NextRequest) {
  const {prompt, url} = await req.json();
  const address = url.includes('https://') ? url : `https://${url}`

  await savePromptRun({ prompt, model: messages.model, url: address });

  // const messages = await client.messages.create({
  //   max_tokens: 1024,
  //   messages: [{ role: "user", content: prompt }],
  //   model: "claude-opus-5-5"
  // });

  const scrap = await (await fetch(address, {
    headers: { "User-Agent": "Mozilla/5.0" },
  })).text();

  const veredict = messages.content.reduce((acc, { text, type }) => {
    if (type === 'text') {
      if (scrap.includes(text)) {
        acc = 'Confirmed'
      }
    }
    return acc
  }, 'Inconclusive')

  return NextResponse.json(veredict, { status: 201 });
}