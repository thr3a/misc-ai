'use server';

import { openai } from '@ai-sdk/openai';
import { createStreamableValue } from '@ai-sdk/rsc';
import { streamObject } from 'ai';
import { schema, systemPrompt } from './util';

export async function generate(input: string) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const inputPrompt = [
      '#改善前のプロンプト',
      '=====プロンプトここから=====',
      input,
      '=====プロンプトここまで====='
    ].join('\n');
    const { partialObjectStream } = await streamObject({
      model: openai('gpt-5.6-terra'),
      instructions: systemPrompt,
      prompt: inputPrompt,
      schema: schema
      // temperature: 0.7
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
