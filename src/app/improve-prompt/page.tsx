'use client';
import { Box, Button, Group, Paper, Textarea } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { IconExternalLink } from '@tabler/icons-react';
import type { z } from 'zod';
import { improvePrompt } from './actions';
import type { schema } from './util';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type FormValues = {
  message: string;
  loading: boolean;
  result: string;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page() {
  const form = useForm({
    initialValues: {
      message: 'ヨーロッパ観光するときの注意点って？',
      loading: false,
      result: ''
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ result: '', loading: true });

    const { improved_prompt } = await improvePrompt(form.values.message);

    form.setValues({ result: improved_prompt.improved_prompt, loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box mx='auto' component='form'>
        <Textarea label='改善前のプロンプト' {...form.getInputProps('message')} minRows={2} maxRows={10} autosize />
        <Group justify='flex-end'>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            送信!
          </Button>
        </Group>
        <Textarea label='改良したプロンプト' {...form.getInputProps('result')} minRows={2} maxRows={10} autosize readOnly />
      </Box>
    </FormProvider>
  );
}
