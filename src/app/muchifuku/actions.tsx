'use server';

// import { geminiNoneFilters } from '@/lib/google';
import { anthropic } from '@ai-sdk/anthropic';
import { createStreamableValue } from '@ai-sdk/rsc';
// import { google } from '@ai-sdk/google';
// import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { schema, systemPrompt } from './util';

export async function generate(input: string) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream } = await streamObject({
      // model: google('gemini-2.0-flash-exp', geminiNoneFilters),
      // model: openai('gpt-4o-mini'),
      model: anthropic('claude-3-5-sonnet-latest'),
      system: systemPrompt,
      prompt: [`新しい4コマ漫画のお題:${input}`].join('\n'),
      schema: schema,
      temperature: 1
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
