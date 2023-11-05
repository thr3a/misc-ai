import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ConversationChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BufferWindowMemory, ChatMessageHistory } from 'langchain/memory';
import { type MessageProps } from '@/features/chat/ChatBox';
import { SystemMessage } from 'langchain/schema';
import { StreamingTextResponse, LangChainStream } from 'ai';

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

export const createChatMessageHistory = async (messages: MessageProps[], ruleMessage: string): Promise<ChatMessageHistory> => {
  const history = new ChatMessageHistory();
  await history.addMessage(new SystemMessage(ruleMessage));
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

  const { stream, handlers } = LangChainStream();
  const history = await createChatMessageHistory(result.data.history, result.data.systemMessage);
  const memory = new BufferWindowMemory({
    chatHistory: history,
    k: 5, // 過去x回分の対話を使用する
    returnMessages: false, // .loadMemoryVariables({})の挙動が変わる
    aiPrefix: result.data.aiPrefix,
    humanPrefix: result.data.humanPrefix
  });
  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_APIKEY ?? 'missing',
    modelName: result.data.modelParams?.name ?? 'gpt-3.5-turbo',
    temperature: result.data.modelParams?.temperature ?? 0.6,
    maxTokens: result.data.modelParams?.max_tokens ?? undefined,
    stop: result.data.modelParams?.stop ?? undefined,
    streaming: true
  });
  const chain = new ConversationChain({
    llm: model,
    memory,
    verbose: true // verboseをtrueにすると処理内容などが出力される
  });
  chain.call({ input: result.data.message, callbacks: [handlers] }).catch((e) => {});
  return new StreamingTextResponse(stream);
}
