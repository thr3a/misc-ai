import 'dotenv/config';
import {
  ActionRowBuilder,
  ApplicationCommandType,
  CacheType,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  ComponentType,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  type Interaction,
  type Message,
  Partials,
  REST,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes
} from 'discord.js';

import admin from 'firebase-admin';
// 型参照を安定させるため namespace も補完
type AdminFirestore = admin.firestore.Firestore;

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

// =================== 設定と定数 ===================

// 反応対象のチャンネルID（将来拡張に備え、配列で持つ）
const ALLOWED_CHANNEL_IDS = new Set<string>(['1005750360301912210']);

// Firestore のコレクション/ドキュメント設計
const COLLECTION_CHANNEL_STATES = 'channelStates'; // channelStates/{channelId}
const COLLECTION_CHANNEL_CONVERSATIONS = 'channelConversations'; // channelConversations/{channelId}/messages

// 絵文字リアクション再生成トリガー
const REGENERATE_EMOJI = '♻️';

// 直近の会話件数
const HISTORY_LIMIT = 50;

// =================== 環境変数の検証 ===================
function getEnv(name: string, optional = false): string | undefined {
  const v = process.env[name];
  if (!v && !optional) {
    console.error(`[ENV] ${name} が設定されていません`);
  }
  return v;
}

const DISCORD_BOT_TOKEN = getEnv('DISCORD_BOT_TOKEN');
const DISCORD_CLIENT_ID = getEnv('DISCORD_CLIENT_ID');
const FIREBASE_PROJECT_ID = getEnv('FIREBASE_PROJECT_ID');
const FIREBASE_CLIENT_EMAIL = getEnv('FIREBASE_CLIENT_EMAIL');
let FIREBASE_PRIVATE_KEY = getEnv('FIREBASE_PRIVATE_KEY');

// PRIVATE_KEY の改行置換
if (FIREBASE_PRIVATE_KEY) {
  FIREBASE_PRIVATE_KEY = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
}

// =================== Firebase Admin 初期化 ===================
let firestore: AdminFirestore | null = null;
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY
      })
    });
  }
  firestore = admin.firestore();
} catch (e) {
  console.error('[Firebase] 初期化に失敗しました:', e);
  firestore = null;
}

// =================== Firestore アクセサ ===================

// チャンネル状態の型
type ChannelState = {
  mode: 'idle' | 'situation_input';
  situation?: string;
  updatedAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
};

// 会話メッセージの型
type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
  // Discordメッセージ関連の参照情報（再生成や追跡に利用）
  discordMessageId?: string; // この会話に対応するBot側メッセージID（assistant の場合）
  discordUserMessageId?: string; // この会話に対応するユーザー側メッセージID（user の場合）
  createdAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
};

async function getChannelState(channelId: string): Promise<ChannelState | null> {
  if (!firestore) return null;
  try {
    const ref = firestore.collection(COLLECTION_CHANNEL_STATES).doc(channelId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    return snap.data() as ChannelState;
  } catch (e) {
    console.error('[Firestore] getChannelState エラー:', e);
    return null;
  }
}

async function setChannelState(channelId: string, partial: Partial<ChannelState>): Promise<boolean> {
  if (!firestore) return false;
  try {
    const ref = firestore.collection(COLLECTION_CHANNEL_STATES).doc(channelId);
    await ref.set(
      {
        mode: 'idle',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...partial
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('[Firestore] setChannelState エラー:', e);
    return false;
  }
}

function channelMessagesColRef(channelId: string) {
  if (!firestore) return null;
  return firestore.collection(COLLECTION_CHANNEL_CONVERSATIONS).doc(channelId).collection('messages');
}

async function addConversationMessage(channelId: string, message: ConversationMessage): Promise<boolean> {
  const col = channelMessagesColRef(channelId);
  if (!col) return false;
  try {
    await col.add({
      ...message,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (e) {
    console.error('[Firestore] addConversationMessage エラー:', e);
    return false;
  }
}

async function fetchRecentMessages(channelId: string, limit: number): Promise<ConversationMessage[]> {
  const col = channelMessagesColRef(channelId);
  if (!col) return [];
  try {
    const snap = await col.orderBy('createdAt', 'asc').get(); // ascで全件取り、後でスライス（createdAtにserverTimestampが入るため）
    const all = snap.docs.map((d: admin.firestore.QueryDocumentSnapshot) => d.data() as ConversationMessage);
    // 直近 limit 件
    return all.slice(Math.max(0, all.length - limit));
  } catch (e) {
    console.error('[Firestore] fetchRecentMessages エラー:', e);
    return [];
  }
}

async function clearConversation(channelId: string): Promise<boolean> {
  const col = channelMessagesColRef(channelId);
  if (!col) return false;
  try {
    const snap = await col.get();
    if (!firestore) return false;
    const batchInstance = (firestore as AdminFirestore).batch();
    for (const doc of snap.docs as admin.firestore.QueryDocumentSnapshot[]) {
      batchInstance.delete(doc.ref);
    }
    await batchInstance.commit();
    return true;
  } catch (e) {
    console.error('[Firestore] clearConversation エラー:', e);
    return false;
  }
}

// Bot の投稿 MessageID から、その前後関係で再生成対象の会話を抽出する
async function buildRegenerateContextFromBotMessage(
  channelId: string,
  botMessageId: string
): Promise<{ system?: string; messages: { role: 'user' | 'assistant'; content: string }[] } | null> {
  const state = await getChannelState(channelId);
  const history = await fetchRecentMessages(channelId, HISTORY_LIMIT);

  // botMessageId に一致する assistant メッセージの位置を取得
  const idx = history.findIndex((m) => m.role === 'assistant' && m.discordMessageId === botMessageId);
  if (idx === -1) return null;

  // 会話は ... BOT:投稿1 (assistant), HUMAN:投稿2 (user), BOT:投稿3 (assistant=対象)
  // 投稿3に♻️ => 投稿1, 投稿2 を使い、投稿3は除外して再生成
  // つまり対象 assistant の一つ前の user、その一つ前の assistant が必要
  const userIdx = idx - 1;
  const prevBotIdx = idx - 2;

  if (userIdx < 0 || prevBotIdx < 0) return null;
  if (history[userIdx]?.role !== 'user' || history[prevBotIdx]?.role !== 'assistant') return null;

  const messages = [
    { role: 'assistant' as const, content: history[prevBotIdx].content },
    { role: 'user' as const, content: history[userIdx].content }
  ];

  return {
    system: state?.situation,
    messages
  };
}

// =================== Discord クライアント初期化 ===================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// =================== スラッシュコマンド登録 ===================
const slashCommands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
  {
    name: 'time',
    description: '現在時刻を返信します（デバッグ用途）',
    type: ApplicationCommandType.ChatInput
  },
  {
    name: 'init',
    description: 'シチュエーション入力モードに入ります',
    type: ApplicationCommandType.ChatInput
  },
  {
    name: 'clear',
    description: '会話履歴を削除します（シチュエーションは保持）',
    type: ApplicationCommandType.ChatInput
  }
];

async function registerCommands() {
  if (!DISCORD_BOT_TOKEN || !DISCORD_CLIENT_ID) return;
  const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), { body: slashCommands });
    console.log('[Discord] スラッシュコマンド登録完了');
  } catch (e) {
    console.error('[Discord] スラッシュコマンド登録失敗:', e);
  }
}

// 許可チャンネルのみ許可
function isAllowedChannel(messageOrInteraction: { channelId: string | null | undefined }): boolean {
  if (!messageOrInteraction.channelId) return false;
  return ALLOWED_CHANNEL_IDS.has(messageOrInteraction.channelId);
}

// タイピング表示
async function withTyping<T>(channel: Message['channel'], fn: () => Promise<T>): Promise<T> {
  try {
    // typing 開始
    if ('sendTyping' in channel && typeof channel.sendTyping === 'function') {
      await channel.sendTyping();
    }
  } catch {
    // ignore
  }
  try {
    return await fn();
  } finally {
    // discord.js v14は明示停止APIなし。sendTypingは数秒継続。
  }
}

// Firestore が未接続時の固定エラーメッセージ
const FIREBASE_ERROR_MSG = '現在、データベースに接続できません。時間をおいて再度お試しください。';
// OpenAI エラーメッセージ
const OPENAI_ERROR_MSG = 'AIの応答がありませんでした。時間をおいて再度お試しください。';

// 会話を OpenAI に投げる
async function chatWithAI(params: {
  system?: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  latestUser?: { content: string };
}): Promise<string | null> {
  try {
    const messages: { role: 'user' | 'assistant'; content: { type: 'text'; text: string }[] }[] = [];

    for (const m of params.history) {
      messages.push({
        role: m.role,
        content: [{ type: 'text', text: m.content }]
      });
    }
    if (params.latestUser) {
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: params.latestUser.content }]
      });
    }

    const openai = createOpenAI({
      baseURL: 'http://192.168.16.20:8000/v1'
    });

    const result = await generateText({
      model: openai.chat('main'),
      maxOutputTokens: 1024,
      system: params.system || 'You are a helpful chatbot.',
      messages
    });

    return result.text || '';
  } catch (e) {
    console.error('[OpenAI] エラー:', e);
    return null;
  }
}

// =================== イベントハンドラ ===================

client.once(Events.ClientReady, async (c) => {
  console.log(`[Discord] ログイン完了: ${c.user.tag}`);
  await registerCommands();
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // チャンネル制限
  if (!isAllowedChannel(interaction)) {
    await interaction.reply({ content: 'このチャンネルでは利用できません。', ephemeral: true });
    return;
  }

  // channelId の型を絞り込む（biome対応: 非nullアサーション禁止）
  const channelId = interaction.channelId;
  if (!channelId) {
    await interaction.reply({ content: 'チャンネル情報を取得できませんでした。', ephemeral: true });
    return;
  }
  const name = interaction.commandName;

  if (name === 'time') {
    // 現在時刻を返信
    const now = new Date();
    await interaction.reply(`現在時刻: ${now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`);
    return;
  }

  if (name === 'init') {
    // シチュエーション入力モードにする
    if (!firestore) {
      await interaction.reply(FIREBASE_ERROR_MSG);
      return;
    }
    const ok = await setChannelState(channelId, { mode: 'situation_input' });
    if (!ok) {
      await interaction.reply(FIREBASE_ERROR_MSG);
      return;
    }
    await interaction.reply('シチュエーションを入力してください');
    return;
  }

  if (name === 'clear') {
    // 会話ログのみ削除（シチュエーションは維持）
    if (!firestore) {
      await interaction.reply(FIREBASE_ERROR_MSG);
      return;
    }
    const ok = await clearConversation(channelId);
    if (!ok) {
      await interaction.reply(FIREBASE_ERROR_MSG);
      return;
    }
    await interaction.reply('過去の会話を削除しました。シチュエーションは維持されます。');
    return;
  }
});

// 通常メッセージ処理
client.on(Events.MessageCreate, async (message: Message) => {
  try {
    // Bot 自身や他 Bot は無視
    if (message.author.bot) return;
    if (message.channel.type !== ChannelType.GuildText) return;

    // チャンネル制限
    if (!ALLOWED_CHANNEL_IDS.has(message.channelId)) return;

    // スラッシュコマンドはここに来ないが、将来の拡張も考慮し "/" 始まりは無視（指定に従いモード破棄）
    if (message.content.startsWith('/')) {
      // シチュエーション入力モードを破棄
      if (firestore) {
        await setChannelState(message.channelId, { mode: 'idle' });
      }
      return;
    }

    // Firestore 必須
    if (!firestore) {
      await message.reply(FIREBASE_ERROR_MSG);
      return;
    }

    const state = (await getChannelState(message.channelId)) ?? ({ mode: 'idle' } as const);

    // シチュエーション入力モードの場合、今回の入力をシチュエーションとして登録
    if (state.mode === 'situation_input') {
      const ok = await setChannelState(message.channelId, {
        mode: 'idle',
        situation: message.content
      });
      if (!ok) {
        await message.reply(FIREBASE_ERROR_MSG);
        return;
      }
      await message.reply('シチュエーションを登録しました。会話を開始できます。');
      return;
    }

    // ここから通常の会話
    await withTyping(message.channel, async () => {
      // ユーザーメッセージを履歴に保存
      await addConversationMessage(message.channelId, {
        role: 'user',
        content: message.content,
        discordUserMessageId: message.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 直近履歴取得
      const history = await fetchRecentMessages(message.channelId, HISTORY_LIMIT);

      // AI呼び出し
      const aiText = await chatWithAI({
        system: (state as ChannelState).situation,
        history,
        latestUser: { content: message.content }
      });

      if (!aiText) {
        await message.reply(OPENAI_ERROR_MSG);
        return;
      }

      const sent = await message.reply(aiText);

      // Bot 応答を保存
      await addConversationMessage(message.channelId, {
        role: 'assistant',
        content: aiText,
        discordMessageId: sent.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
  } catch (e) {
    console.error('[MessageCreate] 予期せぬエラー:', e);
    try {
      await message.reply('エラーが発生しました。時間をおいて再度お試しください。');
    } catch {
      // ignore
    }
  }
});

// リアクションによる再生成
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  try {
    // 部分的（Partial）を解決
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch {
        return;
      }
    }

    const message = reaction.message as Message<true>;
    // Bot のメッセージに対する ♻️ のみ対象
    if (!message.author?.bot) return;
    if (reaction.emoji.name !== REGENERATE_EMOJI) return;

    // チャンネル制限
    if (!ALLOWED_CHANNEL_IDS.has(message.channelId)) return;

    // Firestore 必須
    if (!firestore) {
      await message.reply(FIREBASE_ERROR_MSG);
      return;
    }

    // コンテキスト構築
    const ctx = await buildRegenerateContextFromBotMessage(message.channelId, message.id);
    if (!ctx) {
      await message.reply('再生成に必要な会話履歴が見つかりませんでした。');
      return;
    }

    await withTyping(message.channel, async () => {
      // AI 呼び出し（対象メッセージ=直前assistantは除外済み）
      const aiText = await chatWithAI({
        system: ctx.system,
        history: ctx.messages
      });

      if (!aiText) {
        await message.reply(OPENAI_ERROR_MSG);
        return;
      }

      const sent = await message.reply(aiText);

      // 新しい Bot 応答として保存（今回を最新履歴として追加）
      await addConversationMessage(message.channelId, {
        role: 'assistant',
        content: aiText,
        discordMessageId: sent.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
  } catch (e) {
    console.error('[MessageReactionAdd] エラー:', e);
    try {
      const ch = reaction.message.channel;
      if (ch?.isTextBased?.()) {
        await (ch as unknown as { send: (c: string) => Promise<unknown> }).send(
          'エラーが発生しました。時間をおいて再度お試しください。'
        );
      }
    } catch {
      // ignore
    }
  }
});

// =================== ログイン ===================
async function main() {
  if (!DISCORD_BOT_TOKEN) {
    console.error('DISCORD_BOT_TOKEN が設定されていません。');
    process.exit(1);
  }
  // login 実行前に型ガード
  if (!client) {
    throw new Error('Discord client が初期化されていません。');
  }
  await client.login(DISCORD_BOT_TOKEN);
}

main().catch((e) => {
  console.error('起動時エラー:', e);
  process.exit(1);
});
