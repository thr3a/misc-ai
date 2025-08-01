import { schema, systemPrompt } from '@/app/rp-prompt/util';

import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';

export async function POST(req: Request) {
  const context = await req.json();

  const result = streamObject({
    model: openai('gpt-4.1'),
    system: systemPrompt,
    prompt: context,
    schema: schema,
    temperature: 0.3
  });

  return result.toTextStreamResponse();
}
