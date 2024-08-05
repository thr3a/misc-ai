'use server';

// import { anthropic } from '@ai-sdk/anthropic';
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
      // model: anthropic('claude-3-5-sonnet-20240620'),
      model: openai('gpt-4o'),
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
