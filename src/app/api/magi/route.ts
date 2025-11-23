import { systemPrompt } from '@/app/magi/util';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

import { type UIMessage, convertToModelMessages, streamText } from 'ai';

type ChatRequestBody = {
  messages: UIMessage[];
};

export async function POST(req: Request) {
  const { messages }: ChatRequestBody = await req.json();

  const result = streamText({
    // model: google('gemini-2.5-flash'),
    model: anthropic('claude-haiku-4-5'),
    // model: openai('gpt-4.1-mini'),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    temperature: 0
  });

  return result.toUIMessageStreamResponse();
}

// GPT5はこれ使うこと
//   model: openai('gpt-4.1-mini'),

// geminiは
// model: google('gemini-2.5-flash'),

// クロードは
// model: anthropic('claude-haiku-4-5'),
