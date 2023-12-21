import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { LLMChain } from 'langchain/chains';
// import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BufferWindowMemory, ChatMessageHistory } from 'langchain/memory';
import { type MessageProps } from '@/features/chat/ChatBox';
import { StreamingTextResponse, LangChainStream } from 'ai';
import { PromptTemplate } from 'langchain/prompts';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

const requestSchema = z.object({
  message: z.string(),
  history: z.array(z.object({
    body: z.string(),
    role: z.enum(['human', 'ai'])
  })),
  aiPrefix: z.string().optional().default('ai'),
  humanPrefix: z.string().optional().default('human'),
  systemMessage: z.string(),
  csrfToken: z.string().optional(),
  modelParams: z.object({
    name: z.string().optional(),
    temperature: z.number().optional(),
    max_tokens: z.number().optional(),
    stop: z.array(z.string()).optional()
  }).optional()
});
export type RequestProps = z.input<typeof requestSchema>;

export const createChatMessageHistory = async (messages: MessageProps[]): Promise<ChatMessageHistory> => {
  const history = new ChatMessageHistory();
  await Promise.all(messages.map(async (message) => {
    if (message.role === 'human') {
      await history.addUserMessage(message.body);
    } else {
      await history.addAIChatMessage(message.body);
    }
  }));
  return history;
};

export async function POST (req: NextRequest): Promise<StreamingTextResponse> {
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

  const history = await createChatMessageHistory(result.data.history);
  const prompt = PromptTemplate.fromTemplate(`${result.data.systemMessage}
  {chat_history}
  ${result.data.humanPrefix}: {input}
  ${result.data.aiPrefix}: `);

  const memory = new BufferWindowMemory({
    memoryKey: 'chat_history',
    chatHistory: history,
    k: 5, // 過去x回分の対話を使用する
    returnMessages: false, // .loadMemoryVariables({})の挙動が変わる
    aiPrefix: result.data.aiPrefix,
    humanPrefix: result.data.humanPrefix
  });
  // ****************************************
  // OPENAI
  // ****************************************
  // const model = new ChatOpenAI({
  //   openAIApiKey: process.env.OPENAI_APIKEY ?? 'missing',
  //   modelName: result.data.modelParams?.name ?? 'gpt-3.5-turbo',
  //   temperature: result.data.modelParams?.temperature ?? 0.6,
  //   maxTokens: result.data.modelParams?.max_tokens ?? undefined,
  //   stop: result.data.modelParams?.stop ?? undefined,
  //   streaming: true,
  //   verbose: true
  // });

  // ****************************************
  // GOOGLE
  // ****************************************
  const model = new ChatGoogleGenerativeAI({
    modelName: 'gemini-pro',
    maxOutputTokens: result.data.modelParams?.max_tokens ?? undefined,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE
      }
    ],
    temperature: result.data.modelParams?.temperature ?? 0.6,
    verbose: true
  });
  const chain = new LLMChain({
    llm: model,
    memory,
    prompt,
    verbose: true // verboseをtrueにすると処理内容などが出力される
  });
  const { stream, handlers } = LangChainStream();
  chain.call({ input: result.data.message, callbacks: [handlers] }).catch((e) => {});
  return new StreamingTextResponse(stream);
}
