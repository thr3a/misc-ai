import { scenarioPromptSchema } from '@/app/rp-prompt/type';
import { systemPrompt } from '@/app/rp-prompt/util';
import { createOpenAI } from '@ai-sdk/openai';
import { Output, streamText } from 'ai';

const localOpenAI = createOpenAI({
  baseURL: 'http://192.168.16.21:8000/v1'
});

const openRouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'sk-dummy'
});

export async function POST(req: Request) {
  const { situation, provider } = await req.json();

  const model = provider === 'openrouter' ? openRouter.chat('qwen/qwen3-235b-a22b-2507') : localOpenAI.chat('main');

  const result = streamText({
    model,
    system: systemPrompt,
    prompt: situation,
    output: Output.object({ schema: scenarioPromptSchema }),
    temperature: 0.3
  });

  return result.toTextStreamResponse();
}
