'use client';
import { ActionIcon, Box, Button, CopyButton, Group, List, Paper, Text, Textarea, Tooltip } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { IconCheck, IconCopy } from '@tabler/icons-react';
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

export default function Page() {
  const form = useForm({
    initialValues: {
      message: '',
      loading: false,
      result: { improved_prompt: '', backgrounds: [] }
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ result: { improved_prompt: '', backgrounds: [] }, loading: true });

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
        <Textarea label='改善前のプロンプト' {...form.getInputProps('message')} minRows={2} maxRows={10} autosize placeholder='ヨーロッパ観光するときの注意点って？' />
        <Group justify='center' mt={'sm'}>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            送信!
          </Button>
        </Group>

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

            <Text fw={'bold'} fz={'sm'}>
              プロンプトに含めるとより効果的な項目
            </Text>
            <List>
              {form.values.result.backgrounds?.map((x, index) => {
                return <List.Item key={index}>{x.background}</List.Item>;
              })}
            </List>
          </>
        )}
      </Box>
    </FormProvider>
  );
}
