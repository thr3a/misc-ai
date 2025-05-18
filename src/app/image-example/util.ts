import dedent from 'ts-dedent';
import { z } from 'zod';

export const schema = z.object({
  title: z.string().describe('絵画の名称(日本語)'),
  artist: z.string().describe('絵画の作者(日本語)'),
  creationYear: z.string().optional().describe("制作年。例：'1503年-1506年頃'、'19世紀'"),
  currentLocation: z.string().optional().describe('現在の所蔵場所や展示美術館。例：フランス、ルーヴル美術館'),
  description: z.string().optional().describe('作品に関する詳細な解説や背景。')
});

export const systemPrompt = dedent`
あなたは絵画の専門家です。入力された絵画またはモチーフ絵画の情報を出力してください。
`;
