import { openai } from '@ai-sdk/openai';
import { generateText, Output } from 'ai';
import type { NextRequest } from 'next/server';
import dedent from 'ts-dedent';
import { z } from 'zod';
import { ItemSchema, NullCartGenerateRequestSchema, NullCartItemsResponseSchema } from '@/app/null-cart/types';

export const maxDuration = 300;

const systemPrompt = dedent`
  あなたは、ユーザーの購入欲求を満たすために作られたAmazon風架空のECサイトの商品データジェネレーターです。
  実際の購入は発生しないため、遊び心がありつつも、思わずカートに入れたくなる魅力的な商品を5つ作成してください。

  【スキーマ】
  ${JSON.stringify(z.toJSONSchema(ItemSchema))}

  【制約】
  - description は200文字以上の購買意欲を刺激する説明にする
  - features は具体的な特徴を端的に5つ列挙する
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedFields = NullCartGenerateRequestSchema.safeParse(body);

    if (!validatedFields.success) {
      return Response.json(
        {
          error: 'Invalid request body',
          details: z.flattenError(validatedFields.error).fieldErrors
        },
        { status: 400 }
      );
    }

    const { prompt, taste } = validatedFields.data;

    const realTasteInstruction = dedent`
    リアル系として、実在の通販にありそうな説得力を重視しつつ、少しだけスケールや機能を盛ってください。現実味のある範囲で魅力を最大化してください。
    `;
    const jokeTasteInstruction = dedent`
    ネタ系として、真面目なトーンで徹底的にふざけた商品を提案してください。
    誰が買うのかとツッコミたくなるようなニッチすぎる用途や、無駄に高すぎるオーバースペック、あるいは物理法則を無視したような謎の機能を含めること。
    ただし、商品説明文自体は深夜の通販番組のように異様に熱量がこもっていて、読んでいるうちに「あれ、もしかしてこれ必要なのかも…？」と錯覚させてしまうような、謎の魅力とユーモアを持たせてください。
    `;

    const tasteInstruction = taste === 'real' ? realTasteInstruction : jokeTasteInstruction;

    const result = await generateText({
      model: openai('gpt-5.4-mini'),
      system: systemPrompt,
      prompt: dedent`
        ユーザーが今購入意欲を発散したいテーマ: ${prompt}

        テイスト: ${tasteInstruction}
      `,
      output: Output.object({ schema: NullCartItemsResponseSchema }),
      providerOptions: {
        openai: {
          reasoningEffort: 'low'
        }
      }
    });

    return Response.json(result.output);
  } catch (_error) {
    return Response.json({ error: 'error' }, { status: 500 });
  }
}
