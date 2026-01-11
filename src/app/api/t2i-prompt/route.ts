import { schema } from '@/app/t2i-prompt/type';
import { systemPrompt } from '@/app/t2i-prompt/util';
import { openai } from '@ai-sdk/openai';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { Output, streamText } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

// リクエストボディのスキーマ定義
const requestSchema = z.object({
  prompt: z.string().min(1)
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

    const { prompt } = validatedFields.data;

    const result = streamText({
      model: openai('gpt-5-mini'),
      system: systemPrompt,
      prompt,
      output: Output.object({ schema }),
      providerOptions: {
        openai: {
          reasoningEffort: 'minimal'
        } satisfies OpenAIResponsesProviderOptions
      }
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return Response.json({ error: 'error' }, { status: 500 });
  }
}
