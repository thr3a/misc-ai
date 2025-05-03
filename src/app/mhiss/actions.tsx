'use server';

import type { MessageProps } from '@/features/chat/ChatBox';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { systemMessage } from './util';
export async function continueConversation(history: MessageProps[]) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    // OPENAI
    const openai = createOpenAI({
      // baseURL: 'https://llamacpp.turai.work/v1'
    });
    const { textStream } = await streamText({
      model: openai('gpt-4.1-nano'),
      system: systemMessage,
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
