import { google } from '@ai-sdk/google';
import { Output, streamText } from 'ai';
import type { NextRequest } from 'next/server';
import dedent from 'ts-dedent';
import { z } from 'zod';
import { synthesizeResultSchema } from '@/app/magi/type';

const requestSchema = z.object({
  responses: z.array(z.string().min(1)).length(3)
});

const synthesizeSystemPrompt = dedent`
あなたは多角的な視点を統合し、最適な意思決定を支援する合意形成の専門家です。
複数の回答者から提供された異なる意見や情報を精査・分析し、以下の2つのカテゴリに整理してください。

【commonOpinions（共通している意見）】
- 2名以上の回答者が同じ主張をしている場合、その信頼性は高いと判断できます。
- 共通している主張を簡潔な文として個別にリストアップしてください。
- 「回答1と2が共通して〜と述べています」のように根拠も含めると理想的です。

【conflictingOpinions（対立している意見）】
- 回答者間で意見が分かれている・矛盾している点をリストアップしてください。
- 単に切り捨てるのではなく、対立の背景（前提条件や視点の違い）を簡潔に説明してください。

【スキーマ】
${JSON.stringify(z.toJSONSchema(synthesizeResultSchema))}
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { responses } = requestSchema.parse(body);

    const userPrompt = dedent`
    回答1:
    ${responses[0]}

    回答2:
    ${responses[1]}

    回答3:
    ${responses[2]}
    ---
    `;

    const result = streamText({
      model: google('gemini-3-flash-preview'),
      system: synthesizeSystemPrompt,
      prompt: userPrompt,
      temperature: 0,
      output: Output.object({ schema: synthesizeResultSchema })
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
