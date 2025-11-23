import {
  MODEL_DEFINITION_MAP,
  MODEL_PROVIDER_MAP,
  type ModelKey,
  factCheckPrompt,
  systemPrompt
} from '@/app/magi/util';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { type UIMessage, convertToModelMessages, generateText, streamText } from 'ai';
import dedent from 'ts-dedent';

type Operation = 'chat' | 'fact-check';

type ChatRequestBody = {
  messages?: UIMessage[];
  modelId?: ModelKey;
  operation?: Operation;
  targetModel?: ModelKey;
  targetAnswer?: string;
};

const DEFAULT_OPERATION: Operation = 'chat';

const jsonResponse = (payload: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

const openrouter = (() => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEYが設定されていません。');
  }
  return createOpenRouter({ apiKey });
})();

const resolveModel = (modelId: ModelKey) => {
  const config = MODEL_PROVIDER_MAP[modelId];
  if (!config) {
    throw new Error(`モデル設定 (${modelId}) が見つかりません`);
  }
  if (config.provider === 'google') {
    return google(config.cheapModel);
  }
  if (config.provider === 'openai') {
    return openai(config.cheapModel);
  }
  return openrouter.chat(`anthropic/${config.cheapModel}`);
};

const ensureModelKey = (value: unknown): value is ModelKey => {
  if (!value) {
    return false;
  }
  return (['gemini', 'gpt5', 'claude'] as const).includes(value as ModelKey);
};

const buildFactCheckPrompt = (targetModel: ModelKey, answer: string) => {
  const target = MODEL_DEFINITION_MAP[targetModel];
  return dedent`
対象モデル: ${target.label}
役割: ${target.description}

検証対象の回答:
${answer}

・論拠の正確性
・定量的妥当性
・追加の補足や一次情報
を箇条書き中心でレビューしてください。`;
};

export async function POST(req: Request) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'JSONのパースに失敗しました。' }, { status: 400 });
  }

  const operation = body.operation ?? DEFAULT_OPERATION;

  if (operation === 'fact-check') {
    return handleFactCheck(body);
  }

  return handleChat(body);
}

const handleChat = (body: ChatRequestBody) => {
  if (!body.messages || body.messages.length === 0) {
    return jsonResponse({ error: 'メッセージが空です。' }, { status: 400 });
  }
  if (!ensureModelKey(body.modelId)) {
    return jsonResponse({ error: 'モデル指定が不正です。' }, { status: 400 });
  }

  const model = resolveModel(body.modelId);

  const result = streamText({
    model,
    system: systemPrompt,
    messages: convertToModelMessages(body.messages),
    temperature: 0.3
  });

  return result.toUIMessageStreamResponse({
    originalMessages: body.messages
  });
};

const handleFactCheck = async (body: ChatRequestBody) => {
  if (!ensureModelKey(body.modelId)) {
    return jsonResponse({ error: 'レビュアーモデルが指定されていません。' }, { status: 400 });
  }
  if (!ensureModelKey(body.targetModel)) {
    return jsonResponse({ error: '検証対象モデルが不正です。' }, { status: 400 });
  }
  if (!body.targetAnswer || body.targetAnswer.trim().length === 0) {
    return jsonResponse({ error: '検証対象の回答が必要です。' }, { status: 400 });
  }

  const reviewer = MODEL_DEFINITION_MAP[body.modelId];
  const target = MODEL_DEFINITION_MAP[body.targetModel];
  const prompt = buildFactCheckPrompt(body.targetModel, body.targetAnswer);

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
};
