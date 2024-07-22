import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
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

// ボットが準備完了したときの処理
client.once('ready', () => {
  console.log('ボットが起動しました！');
});

// インタラクションを処理
client.on('interactionCreate', async (interaction) => {
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

// メイン関数を実行
main();
