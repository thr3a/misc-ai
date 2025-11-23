import { systemPrompt } from '@/app/example-chat/util';
import { openai } from '@ai-sdk/openai';
import { type UIMessage, convertToModelMessages, streamText } from 'ai';

type ChatRequestBody = {
  messages: UIMessage[];
};

export async function POST(req: Request) {
  const { messages }: ChatRequestBody = await req.json();

  const result = streamText({
    model: openai('gpt-4.1-mini'),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    temperature: 0
  });

  return result.toUIMessageStreamResponse();
}
