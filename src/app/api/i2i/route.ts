import { Comfy } from '@comfyorg/sdk';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { type I2iResponse, MAX_IMAGE_BYTES, MAX_IMAGES, requestSchema } from '@/app/i2i/type';
import { buildWorkflow, type InputImage, OUTPUT_NODE_ID, toResolution } from '@/app/i2i/workflow';

// 画像生成は時間がかかるため長めに取る
export const maxDuration = 300;

// COMFY_BASE_URL=http://127.0.0.1:8189 (comfy-api-proxy → deep01.local:8188)
// SDK はベース URL を環境変数からしか受け取らないため、未設定ならここで設定する
const createClient = (): Comfy => {
  process.env.COMFY_BASE_URL ??= 'http://127.0.0.1:8189';
  return new Comfy();
};

const toInputImage = async (file: File): Promise<InputImage> => ({
  data: new Uint8Array(await file.arrayBuffer()),
  filename: file.name || 'image',
  contentType: file.type
});

export const POST = async (req: NextRequest) => {
  const form = await req.formData();

  const files = form.getAll('images').filter((value): value is File => value instanceof File);
  if (files.length === 0) {
    return Response.json({ error: '画像を 1 枚以上指定してください' }, { status: 400 });
  }
  if (files.length > MAX_IMAGES) {
    return Response.json({ error: `画像は ${MAX_IMAGES} 枚までです` }, { status: 400 });
  }
  if (files.some((file) => !file.type.startsWith('image/'))) {
    return Response.json({ error: '画像以外のファイルが含まれています' }, { status: 400 });
  }
  if (files.some((file) => file.size > MAX_IMAGE_BYTES)) {
    return Response.json({ error: '画像サイズが大きすぎます' }, { status: 413 });
  }

  const parsed = requestSchema.safeParse({
    prompt: form.get('prompt'),
    aspectRatio: form.get('aspectRatio'),
    megapixels: form.get('megapixels'),
    upsample: form.get('upsample')
  });
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request body', details: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  const { prompt, aspectRatio, megapixels, upsample } = parsed.data;
  const resolution = toResolution(aspectRatio, megapixels);
  const seed = Math.floor(Math.random() * 2 ** 40);
  const images = await Promise.all(files.map(toInputImage));

  const client = createClient();
  const wf = buildWorkflow(client, { prompt, images, resolution, upsample, seed });

  try {
    const job = await client.run(wf);
    const outputs = await Promise.all(
      job.getOutputs(OUTPUT_NODE_ID).map(async (output) => {
        const bytes = await output.toBytes();
        return `data:${output.contentType || 'image/png'};base64,${Buffer.from(bytes).toString('base64')}`;
      })
    );
    const body: I2iResponse = { images: outputs, seed, ...resolution };
    return Response.json(body);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '画像生成に失敗しました';
    return Response.json({ error: message }, { status: 500 });
  }
};
