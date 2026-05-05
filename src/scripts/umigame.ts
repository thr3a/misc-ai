import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { generateText, type ModelMessage, Output } from 'ai';
import dayjs from 'dayjs';
import dedent from 'ts-dedent';
import { z } from 'zod';

const StudentQuestionSchema = z.object({
  question: z.string().describe('YES/NO/IRRELEVANTのいずれかで答えられる質問')
});

const TeacherAnswerSchema = z.object({
  answer: z.enum(['YES', 'NO', 'IRRELEVANT'])
});

const TeacherJudgmentSchema = z.object({
  correct: z.boolean()
});

const QUESTIONS_PER_ROUND = 3;

const localOpenAI = createOpenAI({
  baseURL: 'https://chatgpt-api.turai.work/v1'
}).chat('deep01');

const openRouterModel = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'sk-dummy'
}).chat('z-ai/glm-5.1');

const main = async () => {
  const { values } = parseArgs({
    options: {
      problem: { type: 'string' },
      answer: { type: 'string' },
      local: { type: 'boolean' },
      openrouter: { type: 'boolean' }
    }
  });

  if (!values.problem || !values.answer) {
    console.error(
      '使い方: node --import tsx ./src/scripts/umigame.ts --problem ./problem.txt --answer ./answer.txt [--local|--openrouter]'
    );
    process.exit(1);
  }

  const problemText = readFileSync(values.problem, 'utf-8').trim();
  const answerText = readFileSync(values.answer, 'utf-8').trim();

  console.log(`【問題】\n${problemText}\n`);

  const now = dayjs();
  const fileName = `result_${now.format('YYYYMMDD_HHmmss')}.md`;
  writeFileSync(
    fileName,
    `${dedent`
      # ウミガメのスープ 記録

      - 日時: ${now.format('YYYY-MM-DD HH:mm:ss')}
      - 問題: ${problemText}
      - 模範回答: ${answerText}
    `}\n`
  );

  const teacherQASystemPrompt = dedent`
    あなたはウミガメのスープの出題者です。
    プレイヤーの質問にYES / NO / IRRELEVANT のいずれかのみで答えてください。

    【問題文】
    ${problemText}

    【答えと解説】
    ${answerText}

    必ず以下のJSONのみを返してください：
    { "answer": "YES" | "NO" | "IRRELEVANT" }
  `;

  const teacherJudgeSystemPrompt = dedent`
    あなたはウミガメのスープの出題者です。
    プレイヤーの最終回答が正解かどうかを判定してください。
    細部が多少異なっても、核心となる真相を理解していれば正解とみなしてください。

    【問題文】
    ${problemText}

    【答えと解説】
    ${answerText}
  `;

  const studentSystemPrompt = dedent`
    あなたは水平思考問題（ウミガメのスープ）を解くプレイヤーです。
    出題される問題は、一見不可解だったり矛盾しているように見えますが、推理を重ねることで合理的な説明が導き出されます。

    【ルール】
    - 質問フェーズでは、YES / NO / IRRELEVANT（関係ない）で答えられる形式の質問を1つ投げかけてください。
    - 3回の質問後、推理フェーズとして真相を述べてください。
    - 正解するまで何度でも挑戦できます。過去の質問とそれに対する回答、自分の過去の推理を活かしてください。

    【問題文】
    ${problemText}
  `;

  const studentModel = values.local ? localOpenAI : values.openrouter ? openRouterModel : openai('gpt-5.4');

  const studentMessages: ModelMessage[] = [];
  let roundNumber = 0;

  while (true) {
    roundNumber++;
    console.log(`\n=== ラウンド ${roundNumber} ===`);
    appendFileSync(fileName, `\n## ラウンド ${roundNumber}\n\n### 質問ログ\n\n`);

    // Phase 1: 3回の質問
    for (let q = 1; q <= QUESTIONS_PER_ROUND; q++) {
      console.log(`--- 質問 ${q} / ${QUESTIONS_PER_ROUND} ---`);

      const questionInput =
        studentMessages.length === 0
          ? { prompt: '問題を読んで最初の質問をしてください。' }
          : { messages: studentMessages };

      const studentResult = await generateText({
        model: studentModel,
        output: Output.object({ schema: StudentQuestionSchema }),
        system: studentSystemPrompt,
        ...questionInput
      });

      const question = studentResult.output.question;
      console.log(`生徒AI: ${question}`);

      studentMessages.push({ role: 'assistant', content: question });

      const teacherResult = await generateText({
        model: openai('gpt-5.4'),
        output: Output.object({ schema: TeacherAnswerSchema }),
        system: teacherQASystemPrompt,
        prompt: question,
        providerOptions: {
          openai: {
            reasoningEffort: 'low'
          } satisfies OpenAIResponsesProviderOptions
        }
      });

      const teacherAnswer = teacherResult.output.answer;
      console.log(`先生AI: ${teacherAnswer}\n`);

      studentMessages.push({ role: 'user', content: `出題者の回答: ${teacherAnswer}` });

      appendFileSync(fileName, `${q}. ${question} → ${teacherAnswer}\n`);
    }

    // Phase 2: 強制推理回答
    console.log('--- 推理回答フェーズ ---');

    const { text: studentGuess } = await generateText({
      model: studentModel,
      system: studentSystemPrompt,
      messages: [
        ...studentMessages,
        { role: 'user', content: 'これまでの質問と回答をもとに、真相の推理を述べてください。' }
      ]
    });

    console.log(`生徒AI（推理）: ${studentGuess}\n`);

    studentMessages.push({ role: 'user', content: 'これまでの質問と回答をもとに、真相の推理を述べてください。' });
    studentMessages.push({ role: 'assistant', content: studentGuess });

    appendFileSync(fileName, `\n### 生徒AIの推理回答\n\n${studentGuess}\n`);

    // Phase 3: 先生AIが正解判定
    const judgmentResult = await generateText({
      model: openai('gpt-5.4'),
      output: Output.object({ schema: TeacherJudgmentSchema }),
      system: teacherJudgeSystemPrompt,
      prompt: `プレイヤーの回答: ${studentGuess}`,
      providerOptions: {
        openai: {
          reasoningEffort: 'low'
        } satisfies OpenAIResponsesProviderOptions
      }
    });

    const { correct } = judgmentResult.output;
    const resultLabel = correct ? '正解' : '不正解';
    console.log(`先生AI判定: ${resultLabel}`);

    appendFileSync(fileName, `\n### 先生AIの判定: ${resultLabel}\n\n`);

    if (correct) {
      console.log(`正解！ ${roundNumber}ラウンドで解き明かしました。`);
      appendFileSync(fileName, `\n---\n\n**${roundNumber}ラウンドで正解！**\n`);
      console.log(`結果を ${fileName} に保存しました。`);
      break;
    }

    // 不正解の場合は生徒AIの履歴にフィードバックを追加して次のラウンドへ
    studentMessages.push({
      role: 'user',
      content: `出題者の判定: ${resultLabel}\n引き続き質問して真相に迫ってください。`
    });
  }
};

main();
