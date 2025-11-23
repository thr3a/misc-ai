import { ensureModelKey, jsonResponse, resolveModel } from '@/app/api/magi/helpers';
import { MODEL_DEFINITION_MAP, type ModelKey, factCheckPrompt, factCheckSchema } from '@/app/magi/util';
import { streamObject } from 'ai';

type FactCheckRequestBody = {
  modelId?: ModelKey;
  targetModel?: ModelKey;
  targetAnswer?: string;
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

  const result = streamObject({
    model: resolveModel(body.modelId),
    system: factCheckPrompt,
    prompt: trimmedAnswer,
    schema: factCheckSchema,
    temperature: 0
  });

  return result.toTextStreamResponse({
    headers: {
      'content-type': 'text/event-stream',
      'x-reviewer-label': reviewer.label,
      'x-target-label': target.label
    }
  });
}
