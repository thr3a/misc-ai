import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { Client, Events, GatewayIntentBits, type Message, REST, Routes, SlashCommandBuilder } from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!TOKEN) {
  console.error('BOTトークンが設定されていません。');
  process.exit(1);
}

// スラッシュコマンドを定義
const commands = [new SlashCommandBuilder().setName('time').setDescription('現在の時刻を表示します').toJSON()];

// RESTインスタンスを作成
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', () => {
  console.log('ボットが起動しました！');
});

// メッセージイベントを処理
client.on(Events.MessageCreate, async (message: Message) => {
  // ボット自身の投稿は無視
  if (message.author.bot) return;

  // 一般チャンネルでの投稿のみ処理
  console.log(message.channel.id);
  if (message.channel.id === '1005750360301912210') {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: message.content
    });
    await message.channel.send(text);
  }
});

// インタラクションを処理
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'time') {
    // 現在の日時を取得
    const now = new Date();
    // 日本時間に変換
    const japanTime = now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

    // レスポンスを送信
    await interaction.reply('wait...');
    const message = `現在の日本時間は ${japanTime} です。`;
    await interaction.editReply(message);
  }
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
