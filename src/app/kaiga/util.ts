import dedent from 'ts-dedent';
import { z } from 'zod';
import { type KaigaResult, schema } from './type';

export const systemPrompt = dedent`
あなたは西洋絵画の専門家です。

【スキーマ】
${JSON.stringify(z.toJSONSchema(schema))}
`;

export const buildMarkdown = (value: Partial<KaigaResult>): string => {
  return dedent`
  # 基本情報
  - タイトル: ${value?.title ?? ''}
  - 作者: ${value?.artist || ''}
  - 制作年: ${value?.creationYear || ''}
  - 所蔵/展示: ${value?.currentLocation || ''}

  # 解説
  ${value?.description || ''}
  `;
};
