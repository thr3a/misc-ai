import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { openai } from '@ai-sdk/openai';

export const maxDuration = 300;
import { generateText, Output } from 'ai';
import type { NextRequest } from 'next/server';
import dedent from 'ts-dedent';
import { z } from 'zod';

const requestSchema = z.object({
  problem: z.string().min(1),
  answer: z.string().min(1),
  studentAnswer: z.string().min(1)
});

const JudgmentSchema = z.object({
  correct: z.boolean().describe('生徒の回答が正解かどうか')
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const validatedFields = requestSchema.safeParse(body);

  if (!validatedFields.success) {
    return Response.json(
      { error: 'Invalid request body', details: z.flattenError(validatedFields.error).fieldErrors },
      { status: 400 }
    );
  }

  const { problem, answer, studentAnswer } = validatedFields.data;

  const systemPrompt = dedent`
    あなたはウミガメのスープの出題者です。
    プレイヤーの最終回答が正解かどうかを判定してください。
    細部まで完全に一致している必要はありません。本質的な真相を理解しているかどうかで判断してください。

    【問題文】
    ${problem}

    【正解と解説】
    ${answer}
  `;

  const result = await generateText({
    model: openai('gpt-5.4'),
    output: Output.object({ schema: JudgmentSchema }),
    system: systemPrompt,
    prompt: `プレイヤーの回答: ${studentAnswer}`,
    providerOptions: {
      openai: {
        reasoningEffort: 'medium'
      } satisfies OpenAIResponsesProviderOptions
    }
  });

  return Response.json(result.output);
}
