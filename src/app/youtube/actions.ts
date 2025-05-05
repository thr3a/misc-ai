'use server';

import type { SuccessResponseSchema } from '@/app/api/youtube/route';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import type { MessageProps } from './Chat';
import { systemPrompt } from './util';

export async function fetchTranscript(
  youtubeUrl: string
): Promise<SuccessResponseSchema | { status: 'error'; message: string }> {
  try {
    const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/youtube/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: youtubeUrl, key: process.env.SECRET_KEY })
    });

    if (!response.ok) {
      throw new Error('字幕の取得に失敗しました');
    }

    const data = await response.json();

    return { status: 'ok', title: data.title, transcribed: data.transcribed } as SuccessResponseSchema;
  } catch (error) {
    return { status: 'error', message: String(error) };
  }
}

export async function continueConversation(transcript: string, history: MessageProps[]) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const { textStream } = streamText({
      // model: openai('gpt-4o-mini'),
      model: openai('gpt-4.1-nano'),
      system: systemPrompt(transcript),
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
