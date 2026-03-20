import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, type UIMessage, validateUIMessages } from 'ai';
import type { NextRequest } from 'next/server';
import { systemPrompt } from '@/app/example-chat/util';

type ChatRequestBody = {
  messages: UIMessage[];
};

export async function POST(req: NextRequest) {
  try {
    const { messages }: ChatRequestBody = await req.json();
    const validatedMessages = await validateUIMessages({ messages });

    const result = streamText({
      model: openai('gpt-5-mini'),
      system: systemPrompt,
      messages: await convertToModelMessages(validatedMessages),
      providerOptions: {
        openai: {
          reasoningEffort: 'minimal'
        } satisfies OpenAIResponsesProviderOptions
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
