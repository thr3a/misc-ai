'use server';

import { openai } from '@ai-sdk/openai';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { createStreamableValue } from '@ai-sdk/rsc';
import { streamObject } from 'ai';
import { schema, systemPrompt } from './util';

export async function generate(input: string) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream } = await streamObject({
      model: openai('gpt-5.1'),
      system: systemPrompt,
      prompt: input,
      schema: schema,
      providerOptions: {
        openai: {
          reasoningEffort: 'none'
        } satisfies OpenAIResponsesProviderOptions
      }
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
