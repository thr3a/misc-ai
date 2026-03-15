import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { openai } from '@ai-sdk/openai';
import { type ModelMessage, generateObject } from 'ai';
import dayjs from 'dayjs';
import dedent from 'ts-dedent';
import { z } from 'zod';

const StudentTurnSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('ASK'),
    question: z.string().describe('YES/NO/IRRELEVANTのいずれかで答えられる質問')
  }),
  z.object({
    action: z.literal('FINAL_ANSWER')
  })
]);

const StudentFinalAnswerSchema = z.object({
  answer: z.string().describe('最終回答'),
  reasoning: z.string().describe('答えに至った推理のまとめ')
});

const TeacherAnswerSchema = z.object({
  answer: z.enum(['YES', 'NO', 'IRRELEVANT'])
});

type QAPair = {
  turnNumber: number;
  question: string;
  teacherAnswer: 'YES' | 'NO' | 'IRRELEVANT';
};

const MAX_QUESTIONS = 5;

const main = async () => {
  const { values } = parseArgs({
    options: {
      problem: { type: 'string' },
      answer: { type: 'string' }
    }
  });

  if (!values.problem || !values.answer) {
    console.error('使い方: node --import tsx ./src/scripts/umigame.ts --problem ./problem.txt --answer ./answer.txt');
    process.exit(1);
  }

  const problemText = readFileSync(values.problem, 'utf-8').trim();
  const answerText = readFileSync(values.answer, 'utf-8').trim();

  console.log(`【問題】\n${problemText}\n`);

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

  // 会話履歴
  const studentMessages: ModelMessage[] = [];
  const qaPairs: QAPair[] = [];
  let endReason: 'MAX_QUESTIONS_REACHED' | 'STUDENT_EARLY_EXIT' = 'MAX_QUESTIONS_REACHED';

  // 質問ループ
  for (let turn = 1; turn <= MAX_QUESTIONS; turn++) {
    const remaining = MAX_QUESTIONS - turn + 1;
    console.log(`--- ターン ${turn} / ${MAX_QUESTIONS} (残り${remaining}回) ---`);

    // 生徒AIに質問させる（初回は messages が空のため prompt を使用）
    const studentResult = await generateObject({
      model: openai('gpt-4o-mini'),
      system: buildStudentSystemPrompt(remaining),
      ...(studentMessages.length > 0
        ? { messages: studentMessages }
        : { prompt: '問題を読んで最初の質問をしてください。' }),
      schema: StudentTurnSchema
    });

    const studentTurn = studentResult.object;

    if (studentTurn.action === 'FINAL_ANSWER') {
      console.log('生徒AI: 最終回答に進みます\n');
      endReason = 'STUDENT_EARLY_EXIT';
      // 生徒のassistantメッセージを履歴に追加
      studentMessages.push({ role: 'assistant', content: JSON.stringify(studentTurn) });
      break;
    }

    console.log(`生徒AI: ${studentTurn.question}`);

    // 生徒のassistantメッセージを履歴に追加
    studentMessages.push({ role: 'assistant', content: JSON.stringify(studentTurn) });

    // 先生AIに回答させる
    const teacherResult = await generateObject({
      model: openai('gpt-5.2'),
      system: teacherSystemPrompt,
      prompt: studentTurn.question,
      schema: TeacherAnswerSchema,
      providerOptions: {
        openai: {
          reasoningEffort: 'none'
        } satisfies OpenAIResponsesProviderOptions
      }
    });

    const teacherAnswer = teacherResult.object.answer;
    console.log(`先生AI: ${teacherAnswer}\n`);

    // 履歴に追加
    studentMessages.push({ role: 'user', content: `先生AIの回答: ${teacherAnswer}` });

    qaPairs.push({
      turnNumber: turn,
      question: studentTurn.question,
      teacherAnswer
    });
  }

  // ── 最終回答フェーズ ──────────────────────────────
  console.log('=== 最終回答フェーズ ===\n');

  const finalResult = await generateObject({
    model: openai('gpt-4o-mini'),
    system: dedent`
      あなたは水平思考問題（ウミガメのスープ）を解くプレイヤーです。
      出題される問題は、一見不可解だったり矛盾しているように見えますが、推理を重ねることで合理的な説明が導き出されます。
      これまでの質問と回答を踏まえて、最終回答と推理のまとめを出してください。

      【問題文】
      ${problemText}
    `,
    messages: [...studentMessages, { role: 'user', content: 'これまでの情報を元に最終回答をしてください。' }],
    schema: StudentFinalAnswerSchema
  });

  const finalAnswer = finalResult.object;
  console.log(`【最終回答】${finalAnswer.answer}`);
  console.log(`【推理まとめ】${finalAnswer.reasoning}\n`);

  // ── Markdownファイル保存 ──────────────────────────────
  const now = dayjs();
  const fileName = `result_${now.format('YYYYMMDD_HHmmss')}.md`;

  const qaLog = qaPairs.map((qa) => `${qa.turnNumber}. ${qa.question} > ${qa.teacherAnswer}`).join('\n');

  const markdown = dedent`
    - 日時: ${now.format('YYYY-MM-DD HH:mm:ss')}
    - 問題: ${problemText}
    - 模範回答: ${answerText}

    ## 質問ログ

    ${qaLog}

    ## 生徒AIの最終回答

    回答: ${finalAnswer.answer}
    推理まとめ: ${finalAnswer.reasoning}
  `;

  writeFileSync(fileName, `${markdown}\n`);
  console.log(`結果を ${fileName} に保存しました。`);
};

main();
