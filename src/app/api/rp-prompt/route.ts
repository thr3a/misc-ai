import { createOpenAI, openai } from '@ai-sdk/openai';
import { createTextStreamResponse, Output, streamText, toTextStream } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { type Provider, providerSchema, scenarioPromptSchema } from '@/app/rp-prompt/type';
import { systemPrompt } from '@/app/rp-prompt/util';

// リクエストボディのスキーマ定義
const requestSchema = z.object({
  situation: z.string().min(1, 'situation is required'),
  provider: providerSchema
});

const localOpenAI = createOpenAI({
  baseURL: 'https://chatgpt-api.turai.work/v1'
});

const openRouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'sk-dummy'
});

const selectModel = (provider: Provider) => {
  if (provider === 'openai') return openai('gpt-5.6-terra');
  if (provider === 'openrouter') return openRouter.chat('z-ai/glm-5.2');
  return localOpenAI.chat('main');
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // zodでリクエストボディをバリデーション
    const validatedFields = requestSchema.safeParse(body);

    // バリデーション失敗時はエラーレスポンスを返す
    if (!validatedFields.success) {
      return Response.json(
        {
          error: 'Invalid request body',
          details: z.flattenError(validatedFields.error).fieldErrors
        },
        { status: 400 }
      );
    }

    const { situation, provider } = validatedFields.data;

    const isOpenRouter = provider === 'openrouter';

    const model = selectModel(provider);

    const result = streamText({
      model,
      instructions: systemPrompt,
      prompt: situation,
      output: Output.object({ schema: scenarioPromptSchema }),
      temperature: 0.7,
      providerOptions: isOpenRouter
        ? {
            openai: {
              temperature: 1,
              reasoningEffort: 'medium',
              forceReasoning: false
            }
          }
        : undefined
    });

    return createTextStreamResponse({ stream: toTextStream({ stream: result.stream }) });
  } catch (_error) {
    return Response.json({ error: 'error' }, { status: 500 });
  }
}
