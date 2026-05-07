import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { NextRequest } from 'next/server';
import dedent from 'ts-dedent';
import { z } from 'zod';

export const maxDuration = 300;

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string()
});

const requestSchema = z.object({
  problem: z.string().min(1),
  answer: z.string().min(1),
  messages: z.array(messageSchema)
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

  const { problem, answer, messages } = validatedFields.data;

  // 生徒AIに最終回答を生成させる
  const studentSystemPrompt = dedent`
    あなたは水平思考問題（ウミガメのスープ）を解くプレイヤーです。
    これまでの質問と回答を踏まえて、真相を推理して最終回答を述べてください。
    回答文のみを出力し、余分な説明は一切含めないでください。

    【問題文】
    ${problem}
  `;

  const guessResult = await generateText({
    model: openai('gpt-5.4'),
    system: studentSystemPrompt,
    messages: [...messages, { role: 'user', content: 'これまでの質問と回答をもとに、真相の推理を述べてください。' }],
    providerOptions: {
      openai: {
        reasoningEffort: 'medium'
      } satisfies OpenAIResponsesProviderOptions
    }
  });

  const finalAnswer = guessResult.text;

  // 先生AIに判定させる
  const teacherSystemPrompt = dedent`
    あなたはウミガメのスープの出題者です。
    プレイヤーの最終回答が正解かどうかを判定してください。
    細部まで完全に一致している必要はありません。本質的な真相を理解しているかどうかで判断してください。
    正解なら true、不正解なら false とだけ答えてください。

    【問題文】
    ${problem}

    【正解と解説】
    ${answer}
  `;

  const judgmentResult = await generateText({
    model: openai('gpt-5.4'),
    system: teacherSystemPrompt,
    prompt: `プレイヤーの回答: ${finalAnswer}`,
    providerOptions: {
      openai: {
        reasoningEffort: 'low'
      } satisfies OpenAIResponsesProviderOptions
    }
  });

  return Response.json({
    finalAnswer,
    correct: judgmentResult.text.trim().toLowerCase() === 'true'
  });
}
