import { openai } from '@ai-sdk/openai';
import { Output, streamText } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { schema } from '@/app/meimei/util';

const requestSchema = z.object({
  input: z.string().min(1, 'input is required'),
  type: z.string().min(1, 'type is required'),
  namingConvention: z.string().min(1, 'namingConvention is required')
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validatedFields = requestSchema.safeParse(body);

    if (!validatedFields.success) {
      return Response.json(
        {
          error: 'Invalid request body',
          details: z.flattenError(validatedFields.error).fieldErrors
        },
        { status: 400 }
      );
    }

    const { input, type, namingConvention } = validatedFields.data;

    const prompt = `あなたはソフトウェア開発のエキスパートです。${input}に対して適切な${type}の候補を${namingConvention}形式で6つ提案してください。
各候補はプログラムの可読性と保守性を考慮して簡潔で明確な名前にし、${type}として一般的に理解しやすいものにしてください。`;

    const result = streamText({
      model: openai('gpt-5.4'),
      prompt,
      output: Output.object({ schema }),
      providerOptions: {
        openai: {
          reasoningEffort: 'low'
        }
      }
    });

    return result.toTextStreamResponse();
  } catch (_error) {
    return Response.json({ error: 'error' }, { status: 500 });
  }
}
