'use client';
import { Box, Button, Grid, Group, Paper, TextInput, Textarea, Title } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { readStreamableValue } from 'ai/rsc';
import type { z } from 'zod';
import { generate } from './actions';
import type { schema } from './util';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type FormValues = {
  message: string;
  loading: boolean;
  result: z.infer<typeof schema>;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

const example = `
React ツイッターのようなSNS投稿レイアウト tweet.tsxを作成してください。
- プロフィール画像が左上に配置されていて画像は丸くなっています。
- ユーザー名「X太郎」がプロフィール画像の右側に太字であります。
- ユーザー名の下にユーザーIDが「@xtaro」の形式で表示されています。文字色はグレーです。
- ユーザーIDの下に投稿日時「2024年10月11日 2:13」が右寄せでほかの文字よりも小さくあります。
- 投稿本文がプロフィール画像、投稿日時の下にあります。
`;

export default function Page() {
  const form = useForm({
    initialValues: {
      message: example,
      loading: false,
      result: {
        html: ''
      }
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({
      result: {
        html: ''
      },
      loading: true
    });

    const { object } = await generate(form.values.message);
    for await (const partialObject of readStreamableValue(object)) {
      if (partialObject) {
        form.setValues({ result: partialObject });
      }
    }

    form.setValues({ loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box mx='auto' component='form'>
        <Grid>
          <Grid.Col span={6}>
            <Textarea
              rows={5}
              label='作成したいUIを説明してください'
              {...form.getInputProps('message')}
              placeholder='example'
            />
            <Group justify='center' mt={'sm'} mb={'sm'}>
              <Button onClick={handleSubmit} loading={form.values.loading}>
                作成
              </Button>
            </Group>
          </Grid.Col>
          <Grid.Col span={6}>{form.values.result.html}</Grid.Col>
        </Grid>
      </Box>
    </FormProvider>
  );
}
