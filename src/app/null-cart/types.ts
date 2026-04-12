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

export const NullCartTasteSchema = z.enum(['real', 'joke']);

export type NullCartTaste = z.infer<typeof NullCartTasteSchema>;

export const NullCartGenerateRequestSchema = z.object({
  prompt: z.string().min(1, 'prompt is required').max(200, 'prompt is too long'),
  taste: NullCartTasteSchema
});

export type NullCartGenerateRequest = z.infer<typeof NullCartGenerateRequestSchema>;

export const NullCartItemsResponseSchema = z.object({
  items: z.array(ItemSchema).length(5)
});

export type NullCartItemsResponse = z.infer<typeof NullCartItemsResponseSchema>;

export type CartItem = {
  productId: string;
  quantity: number;
};

export type NullCartOrderSummary = {
  totalPrice: number;
  totalItems: number;
};
