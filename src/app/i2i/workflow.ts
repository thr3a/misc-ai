import type { Comfy, Workflow } from '@comfyorg/sdk';
import { type AspectRatio, RESOLUTIONS } from './type';
import baseWorkflow from './workflow.json';

export type InputImage = {
  data: Uint8Array;
  filename: string;
  contentType: string;
};

type Resolution = { width: number; height: number };

// 解像度は 16 の倍数に丸める（1MP のときテーブルの値をそのまま再現するため）
const RESOLUTION_STEP = 16;

// ワークフロー JSON のうち、画像の読み込み・前処理・解像度選択は枚数に応じて組み直すため除外する
// 4, 5: LoadImage / 21, 31: ImageScaleToTotalPixels / 22: GetImageSize
// 23: ResizeAndPadImage / 24: BatchImagesNode / 32: ResolutionSelector
const REBUILT_NODES = new Set(['4', '5', '21', '22', '23', '24', '31', '32']);

// 出力画像を保存する SaveImage ノード
export const OUTPUT_NODE_ID = '13';

// 1MP の解像度を指定の画素数へ拡大縮小する
export const toResolution = (aspectRatio: AspectRatio, megapixels: number): Resolution => {
  const { width, height } = RESOLUTIONS[aspectRatio];
  const scale = Math.sqrt(megapixels);
  const round = (value: number): number => Math.round((value * scale) / RESOLUTION_STEP) * RESOLUTION_STEP;
  return { width: round(width), height: round(height) };
};

// アップサンプラー用のチャットテンプレート。画像の枚数だけ <Picture n> を並べる
const toUpsamplerTemplate = (count: number): string => {
  const pictures = Array.from(
    { length: count },
    (_, i) => `<Picture ${i + 1}>: <|vision_start|><|image_pad|><|vision_end|>`
  ).join('');
  return `<|im_start|>user\n${pictures}Edit <Picture 1>. {a}<|im_end|>\n<|im_start|>assistant\n<think>\n`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// ノードの inputs から images.* を取り除く（除外したノードへのリンクを残さないため）
const withoutImageInputs = (node: unknown): unknown => {
  if (!isRecord(node) || !isRecord(node.inputs)) return node;
  const inputs = Object.fromEntries(Object.entries(node.inputs).filter(([field]) => !field.startsWith('images.')));
  return { ...node, inputs };
};

type BuildParams = {
  prompt: string;
  images: InputImage[];
  resolution: Resolution;
  upsample: boolean;
  seed: number;
};

export const buildWorkflow = (client: Comfy, { prompt, images, resolution, upsample, seed }: BuildParams): Workflow => {
  // fromJson は渡したオブジェクトをそのまま使うため、リクエスト間で共有しないよう複製する
  const wf = client.workflows.fromJson(
    Object.fromEntries(
      Object.entries(structuredClone(baseWorkflow))
        .filter(([id]) => !REBUILT_NODES.has(id))
        .map(([id, node]) => [id, id === '30' ? withoutImageInputs(node) : node])
    )
  );

  // 画像ごとに LoadImage と 2 種類の縮小ノードを追加する
  //   load_n:  LoadImage
  //   cond_n:  約 4MP に縮小（Conditioning 用）
  //   up_n:    約 1MP に縮小（アップサンプラー用）
  //   pad_n:   2 枚目以降を 1 枚目の 1MP サイズへ白余白で揃える（バッチのサイズを合わせるため）
  const conditioningImages: Record<string, [string, number]> = {};
  const batchImages: Record<string, [string, number]> = {};
  for (const [index, image] of images.entries()) {
    const n = index + 1;
    wf.json[`load_${n}`] = {
      inputs: {
        image: client.assets.fromBytes(image.data, { filename: image.filename, contentType: image.contentType })
      },
      class_type: 'LoadImage',
      _meta: { title: `image_${n}` }
    };
    wf.json[`cond_${n}`] = {
      inputs: { upscale_method: 'lanczos', megapixels: 4, resolution_steps: 32, image: [`load_${n}`, 0] },
      class_type: 'ImageScaleToTotalPixels',
      _meta: { title: `image_${n} at 4 MP` }
    };
    wf.json[`up_${n}`] = {
      inputs: { upscale_method: 'lanczos', megapixels: 1, resolution_steps: 1, image: [`load_${n}`, 0] },
      class_type: 'ImageScaleToTotalPixels',
      _meta: { title: `image_${n} at 1 MP` }
    };
    conditioningImages[`images.image_${n}`] = [`cond_${n}`, 0];

    if (n === 1) {
      batchImages['images.image0'] = ['up_1', 0];
      continue;
    }
    wf.json[`pad_${n}`] = {
      inputs: {
        target_width: ['size_1', 0],
        target_height: ['size_1', 1],
        padding_color: 'white',
        interpolation: 'lanczos',
        image: [`up_${n}`, 0]
      },
      class_type: 'ResizeAndPadImage',
      _meta: { title: `image_${n} padded to image_1` }
    };
    batchImages[`images.image${index}`] = [`pad_${n}`, 0];
  }

  wf.json.size_1 = {
    inputs: { image: ['up_1', 0] },
    class_type: 'GetImageSize',
    _meta: { title: 'image_1 size' }
  };
  wf.json.batch = {
    inputs: batchImages,
    class_type: 'BatchImagesNode',
    _meta: { title: '画像をバッチ処理' }
  };

  wf.setInput('19', 'value', prompt); // Request
  wf.setInput('20', 'f_string', toUpsamplerTemplate(images.length)); // Upsampler input
  wf.setInput('25', 'image', ['batch', 0]); // Prompt upsampler
  wf.setInput('26', 'switch', upsample); // Use prompt upsampler
  // p-h3-image Conditioning: ResolutionSelector(32) からのリンクを直値で上書きし、画像入力を差し替える
  wf.setInput('30', 'width', resolution.width);
  wf.setInput('30', 'height', resolution.height);
  for (const [field, link] of Object.entries(conditioningImages)) {
    wf.setInput('30', field, link);
  }
  wf.setInput('10', 'noise_seed', seed); // RandomNoise

  return wf;
};
