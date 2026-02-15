'use client';

import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import { resizeAndCompressImage } from '@/app/lib/resizeAndCompressImage';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { Box, Button, FileInput, Group, Image, Stack, Text, Textarea, Title } from '@mantine/core';
import { IconPhotoScan } from '@tabler/icons-react';
import { useState } from 'react';
import dedent from 'ts-dedent';
import { type KaigaResult, schema } from './type';

type ApiRequest = {
  imageDataUrl: string;
};

const fileToDataUrl = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました。'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('画像の読み込みに失敗しました。'));
        return;
      }
      resolve(result);
    };
    reader.readAsDataURL(file);
  });
};

const buildMarkdown = (value: Partial<KaigaResult> | undefined): string => {
  if (!value) return '';

  const title = value.title ?? '';
  const artist = value.artist ?? '';
  const creationYear = value.creationYear ?? '';
  const currentLocation = value.currentLocation ?? '';
  const description = value.description ?? '';

  if (!title && !artist && !creationYear && !currentLocation && !description) return '';

  return dedent`
  # ${title || '(不明)'}
  - 作者: ${artist || '(不明)'}
  - 制作年: ${creationYear || '(不明)'}
  - 所蔵/展示: ${currentLocation || '(不明)'}

  ## 解説
  ${description || '(不明)'}
  `;
};

const Page = () => {
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [imageError, setImageError] = useState<string | null>(null);

  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/kaiga',
    schema
  });

  const markdown = buildMarkdown(object);

  const handleSubmit = () => {
    setImageError(null);
    if (!imageDataUrl) {
      setImageError('画像をアップロードしてください。');
      return;
    }
    const payload: ApiRequest = { imageDataUrl };
    submit(payload);
  };

  return (
    <Box>
      <Stack gap='md'>
        <FileInput
          leftSection={<IconPhotoScan size={18} stroke={1.5} />}
          label='絵画画像を選択してください'
          withAsterisk
          accept='image/*'
          leftSectionPointerEvents='none'
          onChange={async (file) => {
            stop();
            setImageError(null);
            setImageDataUrl('');
            if (!file) return;
            try {
              const compressed = await resizeAndCompressImage(file, 1024, 0.8);
              const dataUrl = await fileToDataUrl(compressed);
              setImageDataUrl(dataUrl);
            } catch (e: unknown) {
              const message = e instanceof Error ? e.message : '画像の処理に失敗しました。';
              setImageError(message);
            }
          }}
        />

        {imageError ? (
          <Text size='sm' c='red'>
            {imageError}
          </Text>
        ) : null}

        {imageDataUrl ? <Image src={imageDataUrl} alt='アップロード画像' fit='contain' /> : null}

        <Group justify='center'>
          <Button onClick={handleSubmit} loading={isLoading} disabled={!imageDataUrl}>
            解説してもらう
          </Button>
          <Button variant='light' onClick={stop} disabled={!isLoading}>
            停止
          </Button>
        </Group>

        {error ? (
          <Text size='sm' c='red'>
            {error.message}
          </Text>
        ) : null}

        <Group>
          <Title order={3}>結果</Title>
          <ButtonCopy content={markdown} disabled={!markdown || isLoading} label='コピー' />
        </Group>

        <Textarea
          readOnly
          value={markdown}
          minRows={10}
          autosize
          styles={{ input: { fontFamily: 'monospace', fontSize: 14 } }}
        />
      </Stack>
    </Box>
  );
};

export default Page;
