'use server';

import { openai } from '@ai-sdk/openai';
import { createStreamableValue } from '@ai-sdk/rsc';
import { streamText } from 'ai';
import type { MessageProps } from './Chat';
import { systemPrompt } from './util';

export async function continueConversation(history: MessageProps[]) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const { textStream } = streamText({
      model: openai('gpt-4.1-nano'),
      system: await systemPrompt(),
      messages: history,
      temperature: 0
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
