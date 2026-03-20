import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, type UIMessage, validateUIMessages } from 'ai';
import type { NextRequest } from 'next/server';
import { systemPrompt } from '@/app/youtube/util';

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
      model: openai('gpt-5.4-mini-2026-03-17'),
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
