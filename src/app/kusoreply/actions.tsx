'use server';

import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { schema, systemPrompt } from './util';

export async function generate(input: string) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream } = await streamObject({
      // model: openai('gpt-3.5-turbo'),
      model: openai('gpt-4o'),
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
