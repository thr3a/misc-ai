'use client';
import { resizeAndCompressImage } from '@/app/lib/resizeAndCompressImage';
import { Box, Button, FileInput, Group, List, ListItem, Text, Title } from '@mantine/core';
import { createFormContext, zodResolver } from '@mantine/form';
import { IconPhotoScan } from '@tabler/icons-react';
import { readStreamableValue } from 'ai/rsc';
import { z } from 'zod';
import { generate } from './actions';
import type { schema } from './util';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type FormValues = {
  imageFile: File | null;
  loading: boolean;
  result: z.infer<typeof schema> | null;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page() {
  const form = useForm({
    initialValues: {
      imageFile: null,
      loading: false,
      result: null
    },
    validate: zodResolver(
      z.object({
        imageFile: z.instanceof(File, { message: '画像ファイルをアップロードしてください。' })
      })
    )
  });

  const handleSubmit = async (values: FormValues): Promise<void> => {
    if (!values.imageFile) return;
    if (form.values.loading) return;

    form.setValues({
      result: null,
      loading: true
    });

    const formData = new FormData();
    formData.append('image', values.imageFile);

    const { object } = await generate(formData);
    for await (const partialObject of readStreamableValue(object)) {
      if (partialObject) {
        form.setValues({ result: partialObject as z.infer<typeof schema> });
      }
    }

    form.setValues({ loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box mx='auto' component='form' onSubmit={form.onSubmit(handleSubmit)}>
        <FileInput
          leftSection={<IconPhotoScan size={18} stroke={1.5} />}
          label='絵画画像を選択してください'
          withAsterisk
          value={form.values.imageFile}
          onChange={async (file) => {
            form.setFieldValue('imageFile', null);
            if (!file) {
              return;
            }
            const compressed = await resizeAndCompressImage(file, 1024, 0.8);
            form.setFieldValue('imageFile', compressed);
          }}
          accept='image/*'
          leftSectionPointerEvents='none'
        />
        <Group justify='center' mt={'sm'} mb={'sm'}>
          <Button type='submit' loading={form.values.loading}>
            解説を生成
          </Button>
        </Group>
      </Box>

      {form.values.result && (
        <Box mt={'md'}>
          <Title order={4} mb='xs'>
            絵画の解説
          </Title>
          <List>
            {form.values.result.title && (
              <ListItem>
                <Text fw='bold' component='span'>
                  名称:
                </Text>{' '}
                {form.values.result.title}
              </ListItem>
            )}
            {form.values.result.artist && (
              <ListItem>
                <Text fw='bold' component='span'>
                  作者:
                </Text>{' '}
                {form.values.result.artist}
              </ListItem>
            )}
            {form.values.result.creationYear && (
              <ListItem>
                <Text fw='bold' component='span'>
                  制作年:
                </Text>{' '}
                {form.values.result.creationYear}
              </ListItem>
            )}
            {form.values.result.currentLocation && (
              <ListItem>
                <Text fw='bold' component='span'>
                  所蔵場所:
                </Text>{' '}
                {form.values.result.currentLocation}
              </ListItem>
            )}
            {form.values.result.description && (
              <ListItem>
                <Text fw='bold' component='span'>
                  解説:
                </Text>{' '}
                {form.values.result.description}
              </ListItem>
            )}
          </List>
        </Box>
      )}
    </FormProvider>
  );
}
