'use server';

import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import type { MessageProps } from './Chat';
import { systemPrompt } from './util';

export async function continueConversation(history: MessageProps[], transcript: string) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const { textStream } = streamText({
      model: openai('gpt-4o-mini'),
      system: `${systemPrompt}\n#動画の字幕\n${transcript}`,
      messages: history,
      temperature: 0.2
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

export async function fetchTranscript(url: string) {
  const res = await fetch('/api/youtube', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: url,
      key: process.env.SECRET_KEY
    })
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return await res.json();
}
