import { scenarioPromptSchema } from '@/app/rp-prompt/type';
import { systemPrompt } from '@/app/rp-prompt/util';
import { createOpenAI } from '@ai-sdk/openai';
import { Output, streamText } from 'ai';
const openai = createOpenAI({
  baseURL: 'http://192.168.16.21:8000/v1'
});

export async function POST(req: Request) {
  const context = await req.json();
  const result = streamText({
    model: openai.chat('main'),
    system: systemPrompt,
    prompt: context,
    output: Output.object({ schema: scenarioPromptSchema }),
    temperature: 0.3
  });

  return result.toTextStreamResponse();
}
