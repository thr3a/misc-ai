'use client';

import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import { resizeAndCompressImage } from '@/app/lib/resizeAndCompressImage';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { Button, FileInput, Group, Image, Stack, Text, Textarea, Title } from '@mantine/core';
import { IconPhotoScan } from '@tabler/icons-react';
import { useState } from 'react';
import { schema } from './type';
import { buildMarkdown } from './util';

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

const Page = () => {
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [imageError, setImageError] = useState<string | null>(null);

  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/kaiga',
    schema
  });

  const processMarkdown = (): string => {
    if (!object || Object.keys(object).length === 0) {
      return '';
    }

    return buildMarkdown(object);
  };

  const markdown = processMarkdown();

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
    <Stack gap='md'>
      <FileInput
        leftSection={<IconPhotoScan size={18} stroke={1.5} />}
        label='解説してほしい絵画画像を選択'
        withAsterisk
        accept='image/*'
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

      {imageError && (
        <Text size='sm' c='red'>
          {imageError}
        </Text>
      )}

      {imageDataUrl && (
        <Group justify='center'>
          <Image src={imageDataUrl} fit='contain' mah={500} maw={500} />
        </Group>
      )}

      <Group justify='center'>
        <Button onClick={handleSubmit} loading={isLoading} disabled={!imageDataUrl}>
          解説開始!
        </Button>
        <Button variant='light' onClick={stop} disabled={!isLoading}>
          停止
        </Button>
      </Group>

      {error && (
        <Text size='sm' c='red'>
          {error.message}
        </Text>
      )}

      <Group>
        <Title order={3}>結果</Title>
        <ButtonCopy content={markdown} disabled={!markdown || isLoading} label='コピー' />
      </Group>

      <Textarea readOnly value={markdown} minRows={10} autosize styles={{ input: { fontSize: 14 } }} />
    </Stack>
  );
};

export default Page;
