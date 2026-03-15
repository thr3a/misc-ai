import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { NextRequest } from 'next/server';
import dedent from 'ts-dedent';
import { z } from 'zod';

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

  const { text } = await generateText({
    model: openai('gpt-5.4'),
    system: dedent`
      あなたは水平思考問題（ウミガメのスープ）を解くプレイヤーです。
      出題される問題は、一見不可解だったり矛盾しているように見えますが、推理を重ねることで合理的な説明が導き出されます。
      これまでの質問と回答を踏まえて、最終回答を出してください。
      【問題文】
      ${problem}
    `,
    messages: [...messages, { role: 'user', content: 'これまでの情報を元に最終回答をしてください。' }]
  });

  return Response.json({ answer: text });
}
