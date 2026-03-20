import { createOpenAI } from '@ai-sdk/openai';
import { Output, streamText } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { scenarioPromptSchema } from '@/app/rp-prompt/type';
import { creativeSystemPrompt, systemPrompt } from '@/app/rp-prompt/util';

// リクエストボディのスキーマ定義
const requestSchema = z.object({
  situation: z.string().min(1, 'situation is required'),
  provider: z.enum(['openrouter', 'local']),
  mode: z.enum(['expansion', 'creative']).default('expansion')
});

const localOpenAI = createOpenAI({
  baseURL: 'http://192.168.16.21:8000/v1'
});

const openRouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'sk-dummy'
});

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

    const { situation, provider, mode } = validatedFields.data;

    const isOpenRouter = provider === 'openrouter';

    const model = isOpenRouter ? openRouter.chat('z-ai/glm-5') : localOpenAI.chat('main');

    const selectedSystemPrompt = mode === 'creative' ? creativeSystemPrompt : systemPrompt;

    const result = streamText({
      model,
      system: selectedSystemPrompt,
      prompt: situation,
      output: Output.object({ schema: scenarioPromptSchema }),
      temperature: 0.7,
      providerOptions: isOpenRouter
        ? {
            openai: {
              reasoningEffort: 'none',
              forceReasoning: false
            }
          }
        : undefined
    });

    return result.toTextStreamResponse();
  } catch (_error) {
    return Response.json({ error: 'error' }, { status: 500 });
  }
}
