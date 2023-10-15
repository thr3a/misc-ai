import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
import { OutputFixingParser, StructuredOutputParser } from 'langchain/output_parsers';
import * as ZSchema from './schema';
import { OpenAI } from 'langchain/llms/openai';

const requestSchema = z.object({
  prompt: z.string(),
  type: z.string(),
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

  let schema;
  switch (result.data.type) {
    case 'country':
      schema = ZSchema.countrySchema;
      break;
    case 'paraphrase':
      schema = ZSchema.paraphraseSchema;
      break;
    case 'ggren':
      schema = ZSchema.ggrenSchema;
      break;
    default:
      return NextResponse.json({
        status: 'ng',
        errorMessage: 'Unknown data.type'
      }, { status: 400 });
  }
  const outputParser = StructuredOutputParser.fromZodSchema(schema);
  const outputFixingParser = OutputFixingParser.fromLLM(llm, outputParser);

  // Don't forget to include formatting instructions in the prompt!
  const prompt = new PromptTemplate({
    template: 'Answer the users question as best as possible.:\n{format_instructions}\n{query}',
    inputVariables: ['query'],
    partialVariables: {
      format_instructions: outputFixingParser.getFormatInstructions()
    }
  });

  console.log(prompt);

  const answerFormattingChain = new LLMChain({
    llm,
    prompt,
    outputKey: 'records', // For readability - otherwise the chain output will default to a property named "text"
    outputParser: outputFixingParser,
    verbose: true
  });

  const chainResult = await answerFormattingChain.call({
    query: result.data.prompt
  });

  return NextResponse.json({
    status: 'ok',
    result: chainResult.records
  });
}
