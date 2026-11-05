import { z } from 'zod';

// 1M ピクセル相当の解像度テーブル
export const RESOLUTIONS = {
  '1:1': { width: 1024, height: 1024 },
  '2:3': { width: 832, height: 1248 },
  '3:4': { width: 880, height: 1184 },
  '9:16': { width: 768, height: 1360 },
  '3:2': { width: 1248, height: 832 },
  '4:3': { width: 1184, height: 880 },
  '16:9': { width: 1360, height: 768 }
} satisfies Record<string, { width: number; height: number }>;

export type AspectRatio = keyof typeof RESOLUTIONS;

export const isAspectRatio = (value: string): value is AspectRatio => Object.hasOwn(RESOLUTIONS, value);

export const MAX_IMAGES = 8;

// 出力画像の総画素数（M ピクセル）の上限。GPU のメモリ不足を避けるため
export const MAX_MEGAPIXELS = 4;

// 1 枚あたりのアップロード上限（バイト）
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

// フォームの画像以外の項目
export const requestSchema = z.object({
  prompt: z.string().trim().min(1, '編集指示を入力してください'),
  aspectRatio: z.custom<AspectRatio>((value) => typeof value === 'string' && isAspectRatio(value), {
    message: '未対応のアスペクト比です'
  }),
  megapixels: z.coerce.number().positive().max(MAX_MEGAPIXELS),
  upsample: z.enum(['true', 'false']).transform((value) => value === 'true')
});

export const responseSchema = z.object({
  images: z.array(z.string()),
  seed: z.number(),
  width: z.number(),
  height: z.number()
});

export type I2iResponse = z.infer<typeof responseSchema>;
