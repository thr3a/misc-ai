'use server';

import type { MessageProps } from '@/features/chat/ChatBox';
import { cohere } from '@ai-sdk/cohere';
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
    //   model: openai('gpt-3.5-turbo'),
    //   system: systemMessage,
    //   messages: history
    // });

    // COHERE
    console.log(history);
    console.log(systemMessage2(history));
    const { textStream } = await streamText({
      model: cohere('command-r-plus'),
      prompt: systemMessage2(history),
      temperature: 0.8
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
