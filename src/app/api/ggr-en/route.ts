import { schema } from '@/app/ggr-en/type';
import { systemPrompt } from '@/app/ggr-en/util';
import { openai } from '@ai-sdk/openai';
import { Output, streamText } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

// リクエストボディのスキーマ定義
const requestSchema = z.object({
  query: z.string().min(1, 'query is required')
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

    const { query } = validatedFields.data;

    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: query,
      output: Output.object({ schema }),
      temperature: 0.4
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return Response.json({ error: 'error' }, { status: 500 });
  }
}
