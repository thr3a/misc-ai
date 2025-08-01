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
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
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
