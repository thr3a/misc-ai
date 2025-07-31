'use server';

import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { schema, systemPrompt } from './util';

/**
 * ストリーミング形式で応答を返す
 * 関数名は変えないこと
 */
export async function Generate(input: string) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream } = await streamObject({
      model: openai('gpt-4.1'),
      system: systemPrompt,
      prompt: input,
      schema: schema,
      temperature: 0.3
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
