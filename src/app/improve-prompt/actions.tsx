'use server';

import { geminiNoneFilters } from '@/lib/google';
// import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
// import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { schema, systemPrompt } from './util';

export async function generate(input: string) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream } = await streamObject({
      model: google('gemini-2.0-flash-exp', geminiNoneFilters),
      // model: openai('gpt-3.5-turbo'),
      // model: anthropic('claude-3-5-sonnet-latest'),
      // model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: input,
      schema: schema,
      temperature: 0.7
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
