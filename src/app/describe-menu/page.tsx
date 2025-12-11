'use client';
import { resizeAndCompressImage } from '@/app/lib/resizeAndCompressImage';
import { readStreamableValue } from '@ai-sdk/rsc';
import { Box, Button, FileInput, Group, List, ListItem, Select, Space, Text, Title } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { IconPhotoScan } from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { z } from 'zod/v4';
import { generate } from './actions';
import { CURRENCY_LIST, type schema } from './util';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type FormValues = {
  imageFile: File | null;
  loading: boolean;
  result: z.infer<typeof schema> | null;
  currencyCode: string;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page() {
  const form = useForm({
    initialValues: {
      imageFile: null,
      loading: false,
      result: null,
      currencyCode: CURRENCY_LIST[0].code
    },
    validate: zod4Resolver(
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
          label='メニュー画像を選択してください'
          withAsterisk
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
        <Box mt='md'>
          <Select
            label='通貨を選択してください'
            data={CURRENCY_LIST.map((c) => ({
              value: c.code,
              label: `${c.label}(${c.code}) 1${c.symbol}=${c.rate}円`
            }))}
            value={form.values.currencyCode}
            onChange={(value) => {
              if (value) form.setFieldValue('currencyCode', value);
            }}
          />
        </Box>
        <Group justify='center' mt={'sm'} mb={'sm'}>
          <Button type='submit' loading={form.values.loading}>
            AIに教えてもらう!
          </Button>
        </Group>
      </Box>

      {form.values.result && (
        <Box mt={'md'}>
          <Title order={4} mb='xs'>
            メニュー解析結果
          </Title>
          <List>
            {(form.values.result.items ?? []).map((item, idx) => {
              // priceOriginalから数値部分を抽出
              const priceNum = (() => {
                if (!item.priceOriginal || item.priceOriginal === '不明') return null;
                const match = item.priceOriginal.match(/[\d,.]+/);
                if (!match) return null;
                return Number.parseFloat(match[0].replace(/,/g, ''));
              })();
              const selectedCurrency = CURRENCY_LIST.find((c) => c.code === form.values.currencyCode);
              const priceYen = priceNum && selectedCurrency ? Math.round(priceNum * selectedCurrency.rate) : '不明';
              return (
                <ListItem key={idx}>
                  <Text fw='bold' component='span'>
                    料理名:{' '}
                  </Text>
                  {item.originalName}
                  <br />
                  <Text fw='bold' component='span'>
                    日本語訳:{' '}
                  </Text>
                  {item.TranslatedName}
                  <br />
                  <Text fw='bold' component='span'>
                    カタカナ読み:{' '}
                  </Text>
                  {item.katanakaYomi}
                  <br />
                  <Text fw='bold' component='span'>
                    元の価格:{' '}
                  </Text>
                  {item.priceOriginal}
                  <br />
                  <Text fw='bold' component='span'>
                    日本円換算:{' '}
                  </Text>
                  {priceYen} 円
                  <br />
                  <Text fw='bold' component='span'>
                    解説:{' '}
                  </Text>
                  {item.description}
                  <Space h='md' />
                </ListItem>
              );
            })}
          </List>
        </Box>
      )}
    </FormProvider>
  );
}
