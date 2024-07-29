import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { Client, Events, GatewayIntentBits, type Message, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { app } from './firebase';
import { tobariPrompt } from './util';

const db = getFirestore(app);

type MessageProps = {
  role: 'user' | 'assistant';
  content: string;
};

async function getChatHistory(): Promise<MessageProps[]> {
  const docRef = doc(db, 'chats', 'history');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().messages;
  }
  return [];
}

async function updateChatHistory(messages: MessageProps[]): Promise<void> {
  const docRef = doc(db, 'chats', 'history');
  if (messages.length > 10) {
    messages.shift();
  }
  await setDoc(docRef, { messages });
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
  console.error('BOTトークンが設定されていません。');
  process.exit(1);
}

// スラッシュコマンドを定義
const commands = [new SlashCommandBuilder().setName('time').setDescription('現在の時刻を表示します').toJSON(), new SlashCommandBuilder().setName('reset').setDescription('すべての会話履歴を削除します').toJSON()];

// RESTインスタンスを作成
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.on(Events.MessageCreate, async (message: Message) => {
  // ボット自身の投稿は無視
  if (message.author.bot) return;

  // 一般チャンネルでの投稿のみ処理
  console.log(message.channel.id);
  if (message.channel.id === '1005750360301912210') {
    await message.channel.sendTyping(); // タイピング表示を開始
    const chatHistory = await getChatHistory();
    const newMessage: MessageProps = { role: 'user', content: message.content };
    chatHistory.push(newMessage);
    await updateChatHistory(chatHistory);

    const openai = createOpenAI({
      baseURL: 'http://deep.turai.work/v1'
    });
    const { text } = await generateText({
      // model: openai('gpt-4o-mini'),
      model: anthropic('claude-3-5-sonnet-20240620'),
      system: tobariPrompt,
      messages: chatHistory
    });
    await message.channel.send(text);

    const aiMessage: MessageProps = { role: 'assistant', content: text };
    chatHistory.push(aiMessage);
    await updateChatHistory(chatHistory);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'time') {
    const now = new Date();
    const japanTime = now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    await interaction.reply('wait...');
    const message = `現在の日本時間は ${japanTime} です。`;
    await interaction.editReply(message);
  } else if (commandName === 'reset') {
    await interaction.reply('wait...');
    const docRef = doc(db, 'chats', 'history');
    await setDoc(docRef, { messages: [] });
    await interaction.editReply('すべての会話履歴が削除されました。');
  }
});

client.once('ready', () => {
  console.log('ボットが起動しました！');
});

async function main() {
  try {
    console.log('スラッシュコマンドを登録中...');
    // スラッシュコマンドを登録
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID || 'dummy'), { body: commands });

    console.log('スラッシュコマンドが正常に登録されました。');

    // ボットにログイン
    await client.login(TOKEN);
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

main();
