'use server';

import { geminiNoneFilters } from '@/lib/google';
// import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
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
      // model: google('gemini-2.0-pro-exp-02-05'),
      // model: openai('gpt-3.5-turbo'),
      // model: anthropic('claude-3-5-sonnet-latest'),
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: inputPrompt,
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
