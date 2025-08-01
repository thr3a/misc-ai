'use server';

import { geminiNoneFilters } from '@/lib/google';
import { google } from '@ai-sdk/google';
import { createStreamableValue } from '@ai-sdk/rsc';
import { streamText } from 'ai';
import type { MessageProps } from './Chat';
import { systemPrompt } from './util';

export async function continueConversation(history: MessageProps[]) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const { textStream } = streamText({
      model: google('gemini-2.0-flash-exp'),
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
