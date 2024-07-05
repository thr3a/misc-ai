'use client';
import { ActionIcon, Box, Button, CopyButton, Group, List, Paper, Text, Textarea, Tooltip } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import type { z } from 'zod';
import { improvePrompt } from './actions';
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
      message: 'ヨーロッパ観光するときの注意点って？',
      loading: false,
      result: { improved_prompt: '', advises: [] }
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ result: { improved_prompt: '', advises: [] }, loading: true });
    const { result } = await improvePrompt(form.values.message);
    form.setValues({ result: result, loading: false });
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

        <Text fw={'bold'}>結果</Text>
        {form.values.result.improved_prompt && (
          <>
            <Textarea label='改善後のプロンプト' {...form.getInputProps('result.improved_prompt')} minRows={2} maxRows={10} autosize readOnly />
            <Group justify='flex-end'>
              <CopyButton value={form.values.result.improved_prompt}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'コピーしました' : 'コピー'} withArrow position='left'>
                    <ActionIcon color={copied ? 'teal' : 'blue'} onClick={copy} size='input-sm'>
                      {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>

            <List>
              {form.values.result.advises.map((x) => {
                return <List.Item key={x.advise}>{x.advise}</List.Item>;
              })}
            </List>
          </>
        )}
      </Box>
    </FormProvider>
  );
}
