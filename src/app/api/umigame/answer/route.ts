import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { openai } from '@ai-sdk/openai';
import { Output, generateText } from 'ai';
import type { NextRequest } from 'next/server';
import dedent from 'ts-dedent';
import { z } from 'zod';

const requestSchema = z.object({
  problem: z.string().min(1),
  answer: z.string().min(1),
  question: z.string().min(1)
});

const TeacherAnswerSchema = z.object({
  answer: z.enum(['YES', 'NO', 'IRRELEVANT'])
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

  const { problem, answer, question } = validatedFields.data;

  const systemPrompt = dedent`
    あなたはウミガメのスープの出題者です。
    プレイヤーの質問にYES / NO / IRRELEVANT のいずれかのみで答えてください。

    【問題文】
    ${problem}

    【答えと解説】
    ${answer}

    必ず以下のJSONのみを返してください：
    { "answer": "YES" | "NO" | "IRRELEVANT" }
  `;

  const result = await generateText({
    model: openai('gpt-5.4'),
    output: Output.object({ schema: TeacherAnswerSchema }),
    system: systemPrompt,
    prompt: question,
    providerOptions: {
      openai: {
        reasoningEffort: 'medium'
      } satisfies OpenAIResponsesProviderOptions
    }
  });

  return Response.json(result.output);
}
