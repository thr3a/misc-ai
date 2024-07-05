'use client';
import { Box, Button, Group, Paper, Textarea } from '@mantine/core';
import { ActionIcon, CopyButton, Radio, Stack, TextInput, Title, Tooltip } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { IconCheck, IconCopy } from '@tabler/icons-react';
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
        <Group justify='center' mt={'sm'}>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            送信!
          </Button>
        </Group>
        <Textarea label='改良したプロンプト' {...form.getInputProps('result')} minRows={2} maxRows={10} autosize readOnly />
        {form.values.result && (
          <Group justify='flex-end'>
            <CopyButton value={form.values.result}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'コピーしました' : 'コピー'} withArrow position='left'>
                  <ActionIcon color={copied ? 'teal' : 'blue'} onClick={copy} size='input-sm'>
                    {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        )}
      </Box>
    </FormProvider>
  );
}
