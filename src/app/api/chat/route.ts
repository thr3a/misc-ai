import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ChatPromptTemplate, MessagesPlaceholder } from 'langchain/prompts';
import { ConversationChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BufferMemory, BufferWindowMemory, ChatMessageHistory } from 'langchain/memory';
import { type MessageProps } from '@/features/chat/ChatBox';
import { AIMessage, HumanMessage, SystemMessage } from 'langchain/schema';

// TODO: スキーマから型定義
// https://qiita.com/kjkj_ongr/items/0eff5173b6e4fce7fbe8#%E3%82%B9%E3%82%AD%E3%83%BC%E3%83%9E%E3%81%8B%E3%82%89%E5%9E%8B%E5%AE%9A%E7%BE%A9%E3%81%99%E3%82%8B
const requestSchema = z.object({
  message: z.string(),
  history: z.array(z.object({
    body: z.string(),
    role: z.enum(['human', 'ai'])
  })),
  systemMessage: z.string(),
  csrfToken: z.string().optional()
});
export type RequestProps = z.infer<typeof requestSchema>;

const model = new ChatOpenAI({
  // openAIApiKey: process.env.OPENAI_APIKEY,
  modelName: 'gpt-3.5-turbo',
  temperature: 1
});
const rule = 'あなたは優秀なアシスタントです。';
// const rule = `
// あなたは優秀なアシスタントです。私とゲームをしてください。

// ### ゲームのルール
// - ゲームの参加者は私とあなたの2人のみです。
// - 私が入力した最後のワードの発音の最後の文字から始まるあなたは8文字以内のワードを考えて出力してください。
// - 以下をワードを入力したプレイヤーは負けです
//   - 最後のワードの発音の最後の文字が「ん」で終わるワードを入力したプレイヤー
//   - 存在しないワードを入力したプレイヤー
//   - 既に出力されたワードを入力したプレイヤー
// - これを交互に繰り替えてプレイしていきます。
// - どちらかが負けた時点でゲームは終了です。

// では、ゲームを始めましょう。
// `;

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

  const history = await createChatMessageHistory(result.data.history, rule);
  const memory = new BufferWindowMemory({
    chatHistory: history,
    k: 10, // 過去x回分の対話を使用する
    returnMessages: false // .loadMemoryVariables({})の挙動が変わる
  });
  const chain = new ConversationChain({
    llm: model,
    memory,
    verbose: false // verboseをtrueにすると処理内容などが出力される
  });
  const chainResult = await chain.call({ input: result.data.message });
  return NextResponse.json({
    status: 'ok',
    message: chainResult.response,
    m: await memory.loadMemoryVariables({})
  });
}
