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

  const { problem, messages } = validatedFields.data;

  const systemPrompt = dedent`
    あなたは水平思考問題（ウミガメのスープ）を解くプレイヤーです。
    出題される問題は、一見不可解だったり矛盾しているように見えますが、推理を重ねることで合理的な説明が導き出されます。

    【ルール】
    - YES / NO / IRRELEVANT（関係ない）で答えられる形式の質問を1つだけ投げかけてください。
    - 過去の質問と回答を踏まえて、真相に迫る効果的な質問を選んでください。
    - 質問文のみを出力し、余分な説明は一切含めないでください。

    【問題文】
    ${problem}
  `;

  const result = await generateText({
    model: openai('gpt-5.4'),
    system: systemPrompt,
    ...(messages.length > 0 ? { messages } : { prompt: '問題を読んで最初の質問をしてください。' }),
    providerOptions: {
      openai: {
        reasoningEffort: 'medium'
      } satisfies OpenAIResponsesProviderOptions
    }
  });

  return Response.json({ question: result.text });
}
