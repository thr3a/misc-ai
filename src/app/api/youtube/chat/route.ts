import { systemPrompt } from '@/app/youtube/util';
import { openai } from '@ai-sdk/openai';
import { type UIMessage, convertToModelMessages, streamText, validateUIMessages } from 'ai';
import type { NextRequest } from 'next/server';

type ChatRequestBody = {
  messages: UIMessage[];
  transcript: string;
  title: string;
};

export async function POST(req: NextRequest) {
  try {
    const { messages, transcript, title }: ChatRequestBody = await req.json();
    const validatedMessages = await validateUIMessages({ messages });

    const result = streamText({
      model: openai('gpt-5-mini'),
      system: systemPrompt({ title, transcript }),
      messages: await convertToModelMessages(validatedMessages),
      providerOptions: {
        openai: {
          reasoningEffort: 'minimal'
        }
      }
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
