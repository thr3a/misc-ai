import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { openai } from '@ai-sdk/openai';
import { type ModelMessage, Output, generateText } from 'ai';
import type { NextRequest } from 'next/server';
import dedent from 'ts-dedent';
import { z } from 'zod';

const requestSchema = z.object({
  problem: z.string().min(1),
  answer: z.string().min(1)
});

const StudentTurnSchema = z.object({
  action: z.enum(['ASK', 'FINAL_ANSWER']),
  question: z.string().describe('YES/NO/IRRELEVANTのいずれかで答えられる質問。action が FINAL_ANSWER の場合は空文字列')
});

const TeacherAnswerSchema = z.object({
  answer: z.enum(['YES', 'NO', 'IRRELEVANT'])
});

const MAX_QUESTIONS = 5;

const sendEvent = (controller: ReadableStreamDefaultController, event: string, data: unknown) => {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const validatedFields = requestSchema.safeParse(body);

  if (!validatedFields.success) {
    return Response.json(
      { error: 'Invalid request body', details: z.flattenError(validatedFields.error).fieldErrors },
      { status: 400 }
    );
  }

  const { problem: problemText, answer: answerText } = validatedFields.data;

  const teacherSystemPrompt = dedent`
    あなたはウミガメのスープの出題者です。
    プレイヤーの質問にYES / NO / IRRELEVANT のいずれかのみで答えてください。

    【問題文】
    ${problemText}

    【答えと解説】
    ${answerText}

    必ず以下のJSONのみを返してください：
    { "answer": "YES" | "NO" | "IRRELEVANT" }
  `;

  const buildStudentSystemPrompt = (remaining: number) => dedent`
    あなたは水平思考問題（ウミガメのスープ）を解くプレイヤーです。
    出題される問題は、一見不可解だったり矛盾しているように見えますが、推理を重ねることで合理的な説明が導き出されます。
    ユーザーが出題する「不可解な状況」に対し、核心を突く質問を最大5回行い、その回答を元に真相を解明してください。

    【ルール】
    質問は必ず「YES / NO / IRRELEVANT（関係ない）」で答えられる形式にしてください。
    質問は一度に1つずつ投げかけてください。
    答えに確信が持てたら、質問ではなく action: "FINAL_ANSWER" と解答を返してください。
    最大5回質問できます（残り${remaining}回）。

    【問題文】
    ${problemText}

    【スキーマ】
    ${JSON.stringify(z.toJSONSchema(StudentTurnSchema))}
  `;

  const stream = new ReadableStream({
    async start(controller) {
      const studentMessages: ModelMessage[] = [];

      for (let turn = 1; turn <= MAX_QUESTIONS; turn++) {
        const remaining = MAX_QUESTIONS - turn + 1;
        sendEvent(controller, 'turn_start', { turn, maxTurns: MAX_QUESTIONS });

        const studentResult = await generateText({
          model: openai('gpt-5.4'),
          output: Output.object({ schema: StudentTurnSchema }),
          system: buildStudentSystemPrompt(remaining),
          ...(studentMessages.length > 0
            ? { messages: studentMessages }
            : { prompt: '問題を読んで最初の質問をしてください。' }),
          providerOptions: {
            openai: {
              reasoningEffort: 'high'
            } satisfies OpenAIResponsesProviderOptions
          }
        });

        const studentTurn = studentResult.output;

        if (studentTurn.action === 'FINAL_ANSWER') {
          sendEvent(controller, 'student_early_exit', { turn });
          break;
        }

        const question = studentTurn.question ?? '';
        sendEvent(controller, 'student_question', { turn, question });

        studentMessages.push({ role: 'assistant', content: question });

        const teacherResult = await generateText({
          model: openai('gpt-5.4'),
          output: Output.object({ schema: TeacherAnswerSchema }),
          system: teacherSystemPrompt,
          prompt: question,
          providerOptions: {
            openai: {
              reasoningEffort: 'medium'
            } satisfies OpenAIResponsesProviderOptions
          }
        });

        const teacherAnswer = teacherResult.output.answer;
        sendEvent(controller, 'teacher_answer', { turn, answer: teacherAnswer });

        studentMessages.push({ role: 'user', content: `出題者の回答: ${teacherAnswer}` });
      }

      // 最終回答フェーズ
      sendEvent(controller, 'final_phase', {});

      const { text: finalAnswer } = await generateText({
        model: openai('gpt-5.4'),
        system: dedent`
          あなたは水平思考問題（ウミガメのスープ）を解くプレイヤーです。
          出題される問題は、一見不可解だったり矛盾しているように見えますが、推理を重ねることで合理的な説明が導き出されます。
          これまでの質問と回答を踏まえて、最終回答を出してください。
          【問題文】
          ${problemText}

        `,
        messages: [...studentMessages, { role: 'user', content: 'これまでの情報を元に最終回答をしてください。' }]
      });

      sendEvent(controller, 'final_answer', { answer: finalAnswer });
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
}
