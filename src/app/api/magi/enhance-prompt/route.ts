import { jsonResponse } from '@/app/api/magi/helpers';
import { promptEnhancerSystemPrompt } from '@/app/magi/util';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

type EnhancePromptRequestBody = {
  prompt?: string;
};

export async function POST(req: Request) {
  let body: EnhancePromptRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'JSONのパースに失敗しました。' }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return jsonResponse({ error: '強化対象のプロンプトが必要です。' }, { status: 400 });
  }

  try {
    const { textStream } = await streamText({
      model: openai('gpt-5.1'),
      system: promptEnhancerSystemPrompt,
      prompt,
      providerOptions: {
        openai: {
          reasoningEffort: 'none',
          textVerbosity: 'low'
        }
      }
    });

    let enhancedPrompt = '';
    for await (const delta of textStream) {
      enhancedPrompt += delta;
    }

    const finalizedPrompt = enhancedPrompt.trim();
    return jsonResponse({ enhancedPrompt: finalizedPrompt.length > 0 ? finalizedPrompt : prompt });
  } catch (error) {
    console.error('Prompt enhancement failed', error);
    return jsonResponse({ error: 'プロンプト強化に失敗しました。' }, { status: 500 });
  }
}
