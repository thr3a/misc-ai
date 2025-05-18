'use server';

import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { schema, systemPrompt } from './util';

// 関数名は汎用的にするために変更しないこと
export async function generate(formData: FormData) {
  'use server';

  const imageFile = formData.get('image') as File;
  if (!imageFile) {
    throw new Error('画像ファイルが見つかりません。');
  }

  // 画像ファイルをData URLに変換
  const imageBuffer = await imageFile.arrayBuffer();
  const imageBase64 = Buffer.from(imageBuffer).toString('base64');
  const imageDataUrl = `data:${imageFile.type};base64,${imageBase64}`;

  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream } = await streamObject({
      model: openai('gpt-4.1-nano'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image: new URL(imageDataUrl) },
            { type: 'text', text: 'この絵画について、指定されたスキーマに従って解説してください。' }
          ]
        }
      ],
      schema: schema,
      temperature: 0
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
