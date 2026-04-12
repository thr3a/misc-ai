import { z } from 'zod';

export const ItemSchema = z.object({
  id: z.number().describe('商品ID'),
  name: z.string().describe('商品名'),
  rating: z.number().min(2).max(5).describe('評価（2〜5）'),
  reviewCount: z.number().int().min(0).describe('レビュー数'),
  originalPrice: z.number().int().min(0).describe('定価'),
  discountedPrice: z.number().int().min(0).describe('割引後価格'),
  description: z.string().describe('商品説明'),
  features: z.array(z.string()).length(5).describe('商品特徴リスト')
});

export type Item = z.infer<typeof ItemSchema>;

export type CartItem = {
  productId: string;
  quantity: number;
};
