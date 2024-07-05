'use server';

import type { MessageProps } from '@/features/chat/ChatBox';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { systemMessage } from './util';

export async function continueConversation(history: MessageProps[]) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const { textStream } = await streamText({
      model: openai('gpt-3.5-turbo'),
      system: systemMessage,
      messages: history
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
