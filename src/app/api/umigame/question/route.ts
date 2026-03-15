import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { openai } from '@ai-sdk/openai';
import { Output, generateText } from 'ai';
import type { NextRequest } from 'next/server';
import dedent from 'ts-dedent';
import { z } from 'zod';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string()
});

const requestSchema = z.object({
  problem: z.string().min(1),
  messages: z.array(messageSchema),
  remaining: z.number().int().min(1)
});

const StudentTurnSchema = z.object({
  action: z.enum(['ASK', 'FINAL_ANSWER']),
  question: z.string().describe('YES/NO/IRRELEVANTのいずれかで答えられる質問。action が FINAL_ANSWER の場合は空文字列')
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

  const { problem, messages, remaining } = validatedFields.data;

  const systemPrompt = dedent`
    あなたは水平思考問題（ウミガメのスープ）を解くプレイヤーです。
    出題される問題は、一見不可解だったり矛盾しているように見えますが、推理を重ねることで合理的な説明が導き出されます。
    ユーザーが出題する「不可解な状況」に対し、核心を突く質問を最大5回行い、その回答を元に真相を解明してください。

    【ルール】
    質問は必ず「YES / NO / IRRELEVANT（関係ない）」で答えられる形式にしてください。
    質問は一度に1つずつ投げかけてください。
    答えに確信が持てたら、質問ではなく action: "FINAL_ANSWER" と解答を返してください。
    最大5回質問できます（残り${remaining}回）。

    【問題文】
    ${problem}

    【スキーマ】
    ${JSON.stringify(z.toJSONSchema(StudentTurnSchema))}
  `;

  const result = await generateText({
    model: openai('gpt-5.4'),
    output: Output.object({ schema: StudentTurnSchema }),
    system: systemPrompt,
    ...(messages.length > 0
      ? { messages }
      : { prompt: '問題を読んで最初の質問をしてください。' }),
    providerOptions: {
      openai: {
        reasoningEffort: 'high'
      } satisfies OpenAIResponsesProviderOptions
    }
  });

  return Response.json(result.output);
}
