import type { Item } from './types';

// 文字列から安定したハッシュ値を作る（商品ごとの演出を決定的に揺らすためのシード）
const hashString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
};

// mulberry32: シードから 0〜1 の決定的な疑似乱数を返す
const seededRandom = (seed: number): number => {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const itemSeed = (item: Item): number => hashString(`${item.id}-${item.name}`);

const pickFromSeed = <T>(item: Item, offset: number, pool: readonly T[]): T => {
  const index = Math.floor(seededRandom(itemSeed(item) + offset) * pool.length);
  return pool[index];
};

const intFromSeed = (item: Item, offset: number, min: number, max: number): number =>
  min + Math.floor(seededRandom(itemSeed(item) + offset) * (max - min + 1));

const productEmojis = [
  '🎁',
  '📦',
  '💎',
  '🔥',
  '⭐',
  '🛍️',
  '✨',
  '🧸',
  '🎧',
  '⌚',
  '👟',
  '🎮',
  '📷',
  '🏆',
  '🚀',
  '🪄',
  '🎯',
  '💰'
] as const;

const tileBackgrounds = ['#FFF3E0', '#E3F2FD', '#F3E5F5', '#E8F5E9', '#FFF8E1', '#FCE4EC', '#E0F7FA'] as const;

export type UrgencyBadge = {
  label: string;
  color: string;
};

const urgencyBadges: readonly UrgencyBadge[] = [
  { label: '残りわずか！', color: 'red' },
  { label: '本日限定価格', color: 'orange' },
  { label: 'ベストセラー1位', color: 'yellow' },
  { label: '注目度急上昇', color: 'pink' },
  { label: '売れ筋No.1', color: 'orange' },
  { label: 'ラストチャンス', color: 'red' },
  { label: '再入荷未定', color: 'grape' }
];

// 商品ごとに固定の絵文字（毎回同じ商品には同じ絵文字が出る）
export const getProductEmoji = (item: Item): string => pickFromSeed(item, 1, productEmojis);

// 商品画像タイルの背景色
export const getTileBackground = (item: Item): string => pickFromSeed(item, 2, tileBackgrounds);

// 商品ごとにバラける煽りバッジ
export const getUrgencyBadge = (item: Item): UrgencyBadge => pickFromSeed(item, 3, urgencyBadges);

// 「本日◯個売れています」の個数
export const getSoldToday = (item: Item): number => intFromSeed(item, 4, 7, 128);

// 残り在庫数（少なさで焦らせる）
export const getStockLeft = (item: Item): number => intFromSeed(item, 5, 1, 4);

// 「現在◯人が見ています」のベース人数
export const getViewerBase = (item: Item): number => intFromSeed(item, 6, 9, 58);
