import { z } from 'zod';

export const schema = z.object({
  title: z.string().describe('絵画の名称(日本語)'),
  artist: z.string().describe('絵画の作者(日本語)'),
  creationYear: z.string().describe("制作年 例：'1503年-1506年頃'、'19世紀'（不明な場合は「不明」）"),
  currentLocation: z
    .string()
    .describe('現在の所蔵場所や展示美術館。例：フランス、ルーヴル美術館（不明な場合は「不明」）'),
  description: z.string().describe('作品に関する詳細な解説や背景。（不明な場合は「不明」）')
});

export type KaigaResult = z.infer<typeof schema>;
