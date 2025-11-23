import { ensureModelKey, jsonResponse, resolveModel } from '@/app/api/magi/helpers';
import { MODEL_DEFINITION_MAP, type ModelKey, factCheckPrompt } from '@/app/magi/util';
import { generateText } from 'ai';
import dedent from 'ts-dedent';

type FactCheckRequestBody = {
  modelId?: ModelKey;
  targetModel?: ModelKey;
  targetAnswer?: string;
};

const buildFactCheckPrompt = (targetModel: ModelKey, answer: string) => {
  const target = MODEL_DEFINITION_MAP[targetModel];
  return dedent`
対象モデル: ${target.label}

検証対象の回答:
${answer}

・論拠の正確性
・定量的妥当性
・追加の補足や一次情報
を箇条書き中心でレビューしてください。`;
};

export async function POST(req: Request) {
  let body: FactCheckRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'JSONのパースに失敗しました。' }, { status: 400 });
  }

  if (!ensureModelKey(body.modelId)) {
    return jsonResponse({ error: 'レビュアーモデルが指定されていません。' }, { status: 400 });
  }
  if (!ensureModelKey(body.targetModel)) {
    return jsonResponse({ error: '検証対象モデルが不正です。' }, { status: 400 });
  }
  const trimmedAnswer = body.targetAnswer?.trim();
  if (!trimmedAnswer) {
    return jsonResponse({ error: '検証対象の回答が必要です。' }, { status: 400 });
  }

  const reviewer = MODEL_DEFINITION_MAP[body.modelId];
  const target = MODEL_DEFINITION_MAP[body.targetModel];
  const prompt = buildFactCheckPrompt(body.targetModel, trimmedAnswer);

  const { text } = await generateText({
    model: resolveModel(body.modelId),
    system: factCheckPrompt,
    prompt
  });

  return jsonResponse({
    reviewer: reviewer.label,
    target: target.label,
    content: text.trim()
  });
}
