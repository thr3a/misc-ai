'use server';

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { schema, systemPrompt } from './util';

export async function generate(input: string) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream } = await streamObject({
      // model: openai('gpt-4o-mini'),
      model: anthropic('claude-3-5-sonnet-20240620'),
      system: systemPrompt,
      prompt: [
        `新しい4コマ漫画のお題:${input}`,
        'これは私のキャリアにとって非常に重要です。目標に集中し、それに専念してください。一貫した努力が顕著な成果につながります。'
      ].join('\n'),
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
