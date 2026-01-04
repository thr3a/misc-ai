import { scenarioPromptSchema } from '@/app/rp-prompt/type';
import { systemPrompt } from '@/app/rp-prompt/util';
import { createOpenAI } from '@ai-sdk/openai';
import { Output, streamText } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

// リクエストボディのスキーマ定義
const requestSchema = z.object({
  situation: z.string().min(1, 'situation is required'),
  provider: z.enum(['openrouter', 'local'])
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

    const { situation, provider } = validatedFields.data;

    const model = provider === 'openrouter' ? openRouter.chat('qwen/qwen3-235b-a22b-2507') : localOpenAI.chat('main');

    const result = streamText({
      model,
      system: systemPrompt,
      prompt: situation,
      output: Output.object({ schema: scenarioPromptSchema }),
      temperature: 0.3
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return Response.json({ error: 'error' }, { status: 500 });
  }
}
