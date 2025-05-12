import dedent from 'ts-dedent';
import { z } from 'zod';

const IngredientSchema = z
  .object({
    name: z.string().describe('材料名'),
    quantity: z.string().describe('分量 (例: 「100g」や「大さじ1」など)')
  })
  .describe('個々の材料とその分量');

export const schema = z.object({
  recipeName: z.string().describe('料理名'),
  description: z.string().describe('料理の簡単な説明やキャッチコピー'),
  cookTime: z.string().describe('調理時間 (例: 「約30分」)'),
  ingredients: z.array(IngredientSchema).describe('材料リスト'),
  instructions: z.array(z.string()).describe('調理手順のリスト'),
  tips: z.array(z.string()).describe('調理のコツやポイントを3〜5つ')
});

export const systemPrompt = dedent`
あなたは家庭用料理レシピ提案AIです。
ユーザーから提供された材料、料理の要件に基づいて、最適なレシピを提案してください。

# 注意点
- レシピは具体的で分かりやすく、家庭で簡単に作れるものである必要があります。
- 必要があればうま味調味料である「味の素」をレシピに追加してください。
`;

export function formatRecipeResult(result: z.infer<typeof schema> | null): string {
  if (!result) return '';
  return dedent`
    料理名: ${result.recipeName}
    説明: ${result.description}

    【調理時間】
    ${result.cookTime}

    【材料】
    ${result.ingredients?.map((ing) => `・${ing.name}（${ing.quantity}）`).join('\n') || ''}

    【手順】
    ${result.instructions?.map((step, idx) => `${idx + 1}. ${step}`).join('\n') || ''}

    【コツ・ポイント】
    ${result.tips?.map((tip) => `- ${tip}`).join('\n') || ''}
  `;
}
