import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, type UIMessage, validateUIMessages } from 'ai';
import type { NextRequest } from 'next/server';
import { resolveModel } from '@/app/api/magi/helpers';
import { type ModelKey, systemPrompt } from '@/app/magi/util';

export const maxDuration = 300;

type ChatRequestBody = {
  messages: UIMessage[];
  modelId: ModelKey;
};

export async function POST(req: NextRequest) {
  try {
    const { messages, modelId }: ChatRequestBody = await req.json();
    const validatedMessages = await validateUIMessages({ messages });

    const result = streamText({
      model: resolveModel(modelId),
      system: systemPrompt(),
      messages: await convertToModelMessages(validatedMessages),
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingLevel: 'high',
            includeThoughts: false
          }
        } satisfies GoogleGenerativeAIProviderOptions,
        openai: {
          reasoningEffort: 'medium'
        } satisfies OpenAIResponsesProviderOptions
      },
      temperature: modelId === 'gpt5' ? 1 : 0
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
