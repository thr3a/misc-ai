import { ensureModelKey, jsonResponse, resolveModel } from '@/app/api/magi/helpers';
import { type ModelKey, systemPrompt } from '@/app/magi/util';
import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { type UIMessage, convertToModelMessages, streamText } from 'ai';

type ChatRequestBody = {
  messages?: UIMessage[];
  modelId?: ModelKey;
};

export async function POST(req: Request) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'JSONのパースに失敗しました。' }, { status: 400 });
  }

  if (!body.messages || body.messages.length === 0) {
    return jsonResponse({ error: 'メッセージが空です。' }, { status: 400 });
  }
  if (!ensureModelKey(body.modelId)) {
    return jsonResponse({ error: 'モデル指定が不正です。' }, { status: 400 });
  }

  const result = streamText({
    model: resolveModel(body.modelId),
    system: systemPrompt(),
    messages: convertToModelMessages(body.messages),
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
    temperature: body.modelId === 'gpt5' ? 1 : 0
  });

  return result.toUIMessageStreamResponse({
    originalMessages: body.messages
  });
}
