'use client';

import {
  ActionIcon,
  Anchor,
  Button,
  Card,
  FileButton,
  Group,
  Image,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea
} from '@mantine/core';
import { useListState } from '@mantine/hooks';
import { IconArrowLeft, IconArrowRight, IconPhotoPlus, IconTrash, IconWand } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { resizeAndCompressImage } from '@/app/lib/resizeAndCompressImage';
import { ReferenceLinks } from './ReferenceLinks';
import { type I2iResponse, isAspectRatio, MAX_IMAGES, RESOLUTIONS, responseSchema } from './type';

type InputItem = {
  id: string;
  file: File;
  url: string;
};

const aspectRatioOptions = Object.entries(RESOLUTIONS).map(([ratio, { width, height }]) => ({
  value: ratio,
  label: `${ratio}（1MP: ${width}×${height}）`
}));

const megapixelOptions = [
  { value: '1', label: '1MP' },
  { value: '2', label: '2MP' },
  { value: '4', label: '4MP' }
];

// Conditioning では約 4MP に縮小されるため、長辺 2048px まで残して送る
const UPLOAD_MAX_SIZE = 2048;

const Page = () => {
  const [items, handlers] = useListState<InputItem>([]);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<string>('2:3');
  const [megapixels, setMegapixels] = useState<string>('4');
  const [upsample, setUpsample] = useState(true);
  // 空文字のときはランダムシード
  const [seed, setSeed] = useState<string | number>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<I2iResponse | null>(null);

  // アンマウント時にプレビュー用の Object URL を解放する
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(
    () => () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.url);
      }
    },
    []
  );

  const handleAdd = (files: File[]) => {
    setError(null);
    const remaining = MAX_IMAGES - items.length;
    if (files.length > remaining) {
      setError(`画像は ${MAX_IMAGES} 枚までです。先頭の ${remaining} 枚だけ追加しました。`);
    }
    handlers.append(
      ...files.slice(0, remaining).map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }))
    );
  };

  const handleRemove = (index: number) => {
    const item = items[index];
    if (item) URL.revokeObjectURL(item.url);
    handlers.remove(index);
  };

  const handleSubmit = async () => {
    setError(null);
    if (items.length === 0) {
      setError('画像を 1 枚以上追加してください。');
      return;
    }
    if (!prompt.trim()) {
      setError('編集指示を入力してください。');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      const compressed = await Promise.all(
        items.map((item) => resizeAndCompressImage(item.file, UPLOAD_MAX_SIZE, 0.92))
      );
      for (const file of compressed) {
        form.append('images', file);
      }
      form.append('prompt', prompt);
      form.append('aspectRatio', aspectRatio);
      form.append('megapixels', megapixels);
      form.append('upsample', String(upsample));
      if (seed !== '') form.append('seed', String(seed));

      const response = await fetch('/api/i2i', { method: 'POST', body: form });
      const payload: unknown = await response.json().catch(() => null);
      const parsed = responseSchema.safeParse(payload);
      if (!response.ok || !parsed.success) {
        const message =
          typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string'
            ? payload.error
            : '画像生成に失敗しました。';
        setError(message);
        return;
      }
      setResult(parsed.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '画像生成に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap='md' mb={'lg'}>
      <Group justify='flex-end'>
        <ReferenceLinks />
      </Group>

      <Stack gap='xs'>
        <Group>
          <FileButton onChange={handleAdd} accept='image/*' multiple>
            {(props) => (
              <Button
                {...props}
                variant='light'
                leftSection={<IconPhotoPlus size={18} />}
                disabled={items.length >= MAX_IMAGES}
              >
                画像を追加
              </Button>
            )}
          </FileButton>
          <Text size='sm' c='dimmed'>
            {items.length} / {MAX_IMAGES} 枚
          </Text>
        </Group>
      </Stack>

      {items.length > 0 && (
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          {items.map((item, index) => (
            <Card key={item.id} withBorder padding='xs'>
              <Stack gap='xs'>
                <Image src={item.url} h={160} fit='contain' />
                <Group justify='space-between' wrap='nowrap'>
                  <Text size='sm' fw={index === 0 ? 'bold' : undefined}>
                    Picture {index + 1}
                  </Text>
                  <Group gap={4} wrap='nowrap'>
                    <ActionIcon
                      variant='subtle'
                      aria-label='前へ'
                      disabled={index === 0}
                      onClick={() => handlers.reorder({ from: index, to: index - 1 })}
                    >
                      <IconArrowLeft size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant='subtle'
                      aria-label='後ろへ'
                      disabled={index === items.length - 1}
                      onClick={() => handlers.reorder({ from: index, to: index + 1 })}
                    >
                      <IconArrowRight size={16} />
                    </ActionIcon>
                    <ActionIcon variant='subtle' color='red' aria-label='削除' onClick={() => handleRemove(index)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Textarea
        label='編集指示'
        withAsterisk
        autosize
        minRows={3}
        placeholder='Picture 1の女性がPicture 2と全く同じポーズをする。顔、髪型、服装はPicture 1のまま'
        value={prompt}
        onChange={(event) => setPrompt(event.currentTarget.value)}
      />

      <Group align='flex-end'>
        <Select
          label='アスペクト比'
          data={aspectRatioOptions}
          value={aspectRatio}
          onChange={(value) => value && isAspectRatio(value) && setAspectRatio(value)}
          allowDeselect={false}
        />
        <Select
          label='画素数'
          data={megapixelOptions}
          value={megapixels}
          onChange={(value) => value && setMegapixels(value)}
          allowDeselect={false}
          w={120}
        />
        <NumberInput
          label='シード'
          placeholder='ランダム'
          value={seed}
          onChange={setSeed}
          min={0}
          max={Number.MAX_SAFE_INTEGER}
          allowDecimal={false}
          allowNegative={false}
          w={200}
        />
        <Switch
          label='プロンプトアップサンプラー'
          checked={upsample}
          onChange={(event) => setUpsample(event.currentTarget.checked)}
          mb='xs'
        />
      </Group>

      <Button leftSection={<IconWand size={18} />} loading={loading} onClick={handleSubmit}>
        生成する
      </Button>

      {error && (
        <Text size='sm' c='red'>
          {error}
        </Text>
      )}

      {result && (
        <Stack gap='xs'>
          <Group gap='xs'>
            <Text size='sm' c='dimmed'>
              seed: {result.seed}
            </Text>
            <Button size='compact-xs' variant='subtle' onClick={() => setSeed(result.seed)}>
              このシードを使う
            </Button>
          </Group>
          {result.images.map((src, index) => (
            <Stack key={src.slice(-32)} gap='xs'>
              <Image src={src} fit='contain' mah={800} />
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default Page;
