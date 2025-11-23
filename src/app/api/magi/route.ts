import { openai } from '@ai-sdk/openai';
import { type UIMessage, convertToModelMessages, streamText } from 'ai';

const SYSTEM_PROMPT = 'あなたは涼宮ハルヒです。涼宮ハルヒの口調、性格、考え方を意識して私と会話してください。';

type ChatRequestBody = {
  messages: UIMessage[];
};

export async function POST(req: Request) {
  const { messages }: ChatRequestBody = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages)
  });

  return result.toUIMessageStreamResponse();
}
