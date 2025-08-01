'use server';

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { createStreamableValue } from '@ai-sdk/rsc';
import { streamObject } from 'ai';
import { schema, systemPrompt } from './util';

export async function generate(input: string) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream } = await streamObject({
      model: openai('gpt-4o-mini'),
      // model: anthropic('claude-3-5-sonnet-20240620'),
      system: systemPrompt,
      prompt: input,
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
