import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { OpenAI } from 'langchain/llms/openai';

const requestSchema = z.object({
  prompt: z.string(),
  csrfToken: z.string().optional(),
  modelParams: z.object({
    name: z.string().optional(),
    temperature: z.number().optional()
  }).optional()
});
export type RequestProps = z.infer<typeof requestSchema>;

export async function POST (req: NextRequest): Promise<NextResponse> {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({
      status: 'ng',
      errorMessage: 'Parse error'
    });
  }
  const result = requestSchema.safeParse(body);
  if (!result.success) {
    const { errors } = result.error;
    return NextResponse.json({
      status: 'ng',
      errorMessage: 'Validation error',
      errors
    }, { status: 400 });
  }

  const llm = new OpenAI({
    openAIApiKey: process.env.OPENAI_APIKEY ?? 'missing',
    modelName: result.data.modelParams?.name ?? 'gpt-3.5-turbo-instruct',
    temperature: result.data.modelParams?.temperature ?? 0.2
  });
  const ChatResult = await llm.call(result.data.prompt);
  return NextResponse.json({
    status: 'ok',
    message: ChatResult
  });
}
