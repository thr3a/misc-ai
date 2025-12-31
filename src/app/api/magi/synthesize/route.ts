import { jsonResponse, resolveModel } from '@/app/api/magi/helpers';
import { streamText } from 'ai';
import dedent from 'ts-dedent';

type SynthesizeRequestBody = {
  responses: string[];
};

const synthesizeSystemPrompt = dedent`
あなたは多角的な視点を統合し、最適な意思決定を支援する合意形成の専門家です。
複数の回答者から提供された異なる意見や情報を精査・分析し、矛盾を解消した上で、最も信頼性が高く論理的な一つの結論を出力してください。

【ルール】
- 複数の回答者が同じ主張をしている場合、その信頼性は高いと判断できます。そのため、2名以上の回答者が支持している主張を結論の骨子として優先的に採用すること。
「ここは回答1、2、3のいずれも共通しています。」「これは回答1と2で言及されています。」などがあるとわかりやすい。
- 単に複数の回答を並べるのではなく、一貫性のある文章として統合してください。
- 意見の対立や矛盾がある場合、単に切り捨てるのではなく、その背景（前提条件や視点の違い）を分析し、それらを包含した論理的な説明を加えること
- Markdown記法は使用せずプレーンテキストで出力してください。
`;

export async function POST(req: Request) {
  let body: SynthesizeRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'JSONのパースに失敗しました。' }, { status: 400 });
  }

  if (!body.responses || body.responses.length !== 3) {
    return jsonResponse({ error: '3つの回答が必要です。' }, { status: 400 });
  }

  if (body.responses.some((response) => typeof response !== 'string' || response.length === 0)) {
    return jsonResponse({ error: 'すべての回答が空でない文字列である必要があります。' }, { status: 400 });
  }

  const userPrompt = dedent`
回答1:
${body.responses[0]}

回答2:
${body.responses[1]}

回答3:
${body.responses[2]}
---
`;

  const result = streamText({
    model: resolveModel('gpt5'),
    system: synthesizeSystemPrompt,
    prompt: userPrompt
  });

  return result.toTextStreamResponse();
}
