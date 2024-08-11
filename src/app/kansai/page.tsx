'use client';
import { Box, Button, Group, Textarea, Title } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import type { z } from 'zod';
import { Generate } from './actions';
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

export default function Page() {
  const form = useForm({
    initialValues: {
      message: 'よく焼いたパンなら好きだ。',
      loading: false,
      result: {
        text: ''
      }
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ result: { text: '' }, loading: true });

    const { object } = await Generate(form.values.message);

    form.setValues({ result: object, loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box maw={600} mx='auto' component='form'>
        <Textarea
          label='処理の概要を記述してください'
          withAsterisk
          {...form.getInputProps('message')}
          placeholder='駐車場に忘れ物してきちゃった！'
        />
        <Group justify='center'>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            変換！
          </Button>
        </Group>
        <Group mt='sm' mb='sm'>
          <Title order={2}>変換結果</Title>
        </Group>

        <Textarea readOnly withAsterisk {...form.getInputProps('result.text')} />
      </Box>
    </FormProvider>
  );
}
