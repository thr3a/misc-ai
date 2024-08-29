'use server';

import type { MessageProps } from '@/features/chat/ChatBox';
import { geminiNoneFilters } from '@/lib/google';
import { google } from '@ai-sdk/google';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { systemMessage, systemMessage2 } from './util';
export async function continueConversation(history: MessageProps[]) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    // OPENAI
    // const { textStream } = await streamText({
    //   model: openai('gpt-4o-mini'),
    //   system: systemMessage,
    //   messages: history
    // });

    // google
    const { textStream } = await streamText({
      model: google('gemini-1.5-flash-latest', geminiNoneFilters),
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
