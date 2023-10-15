import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PromptTemplate } from 'langchain/prompts';
import { CommaSeparatedListOutputParser } from 'langchain/output_parsers';
import { OpenAI } from 'langchain/llms/openai';
import { RunnableSequence } from 'langchain/schema/runnable';

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
    modelName: result.data.modelParams?.name ?? 'gpt-3.5-turbo',
    temperature: result.data.modelParams?.temperature ?? 0,
    openAIApiKey: process.env.OPENAI_APIKEY ?? 'missing'
  });

  const parser = new CommaSeparatedListOutputParser();
  const chain = RunnableSequence.from([
    PromptTemplate.fromTemplate('{prompt}.\n{format_instructions}'),
    llm,
    parser
  ]);
  const chainResult = await chain.invoke({
    subject: 'ice cream flavors',
    prompt: result.data.prompt,
    format_instructions: parser.getFormatInstructions()
  });

  return NextResponse.json({
    status: 'ok',
    result: chainResult
  });
}
