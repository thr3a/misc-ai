'use server';

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { type MessageProps, firstSystemPrompt, systemPrompt } from './util';

export async function generate(topic: string, history: MessageProps[]) {
  'use server';

  const stream = createStreamableValue();

  console.log(history);

  (async () => {
    const { textStream } = await streamText({
      model: openai('gpt-4o-mini'),
      system:
        history.length === 0
          ? [firstSystemPrompt, '# 議題', topic].join('\n')
          : [systemPrompt, '# 議題', topic].join('\n'),
      messages: history,
      temperature: 1
    });

    for await (const text of textStream) {
      stream.update(text);
    }

    stream.done();
  })();

  return {
    messages: history,
    newMessage: stream.value
  };
}
