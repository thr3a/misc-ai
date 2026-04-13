import { openai } from '@ai-sdk/openai';
import { generateText, Output } from 'ai';
import type { NextRequest } from 'next/server';
import dedent from 'ts-dedent';
import { z } from 'zod';
import { ItemSchema, NullCartGenerateRequestSchema, NullCartItemsResponseSchema } from '@/app/null-cart/types';

export const maxDuration = 300;

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
    ユーモア系よりかはリアル系で現実感のある商品を考えてください。少しだけ数値の仕様や機能を誇張してください。
    `;
    const jokeTasteInstruction = dedent`
    リアル系よりかはユーモア系で真面目なトーンで徹底的にふざけた商品を考えてください。
    誰が買うのかとツッコミたくなるようなニッチすぎる用途や、無駄に高すぎるオーバースペック、あるいは物理法則を無視したような謎の機能を含めてください。
    `;

    const tasteInstruction = taste === 'real' ? realTasteInstruction : jokeTasteInstruction;

    const systemPrompt = dedent`
    あなたは、ユーザーの購入欲求を満たすために作られたAmazon風架空のECサイトの商品データジェネレーターです。
    実際の購入は発生しないため、遊び心がありつつも、思わずカートに入れたくなる魅力的な商品を5つ作成してください。
    ${tasteInstruction}

    【スキーマ】
    ${JSON.stringify(z.toJSONSchema(ItemSchema))}

    【制約】
    数値の仕様も記載すること(イヤホンなら12時間駆動やSSDなら200GBなど)
    Amazonで取り扱っていない商品(高層マンションやエジプトのツタンカーメン、宇宙ステーション)などを入力されてもそれを模した商品ではなくそれ自体を商品と考えて商品を作成してください。
    - description は200文字以上の購買意欲を刺激する説明にする
    - features は具体的な特徴を端的に5つ列挙する
    `;

    const result = await generateText({
      model: openai('gpt-5.4'),
      system: systemPrompt,
      prompt: dedent`
        ユーザーが今購入意欲を発散したい商品テーマ: ${prompt}
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
