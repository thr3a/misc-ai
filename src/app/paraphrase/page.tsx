'use client';
import { SuggestWords } from '@/app/paraphrase/actions';
import type { schema } from '@/app/paraphrase/util';
import { ActionIcon, Box, Button, CopyButton, Group, Radio, Stack, TextInput, Title, Tooltip } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import type { z } from 'zod';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type ContextProps = {
  casual: { label: string; prompt: string };
  business_mail: { label: string; prompt: string };
  osaka: { label: string; prompt: string };
};
const contexts: ContextProps = {
  casual: { label: 'カジュアル', prompt: 'casual,friendly,in chat' },
  business_mail: { label: 'ビジネスメール', prompt: 'Business email, formal' },
  osaka: { label: '関西弁', prompt: '関西弁,kansai dialect,Kansai-ben' }
};

type FormValues = {
  message: string;
  loading: boolean;
  result: z.infer<typeof schema>;
  context: keyof ContextProps;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page() {
  const form = useForm({
    initialValues: {
      message: '連絡ください',
      loading: false,
      result: { words: [] },
      context: 'casual'
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ result: { words: [] }, loading: true });

    const { words } = await SuggestWords(form.values.message, contexts[form.values.context].prompt);

    form.setValues({ result: words, loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box maw={600} mx='auto' component='form'>
        <TextInput label='言い換えたいワード・文章' withAsterisk {...form.getInputProps('message')} />
        <Radio.Group label='スタイル' {...form.getInputProps('context')}>
          <Stack mt='xs'>
            {Object.keys(contexts).map((key) => (
              <Radio key={key} value={key} label={contexts[key as keyof ContextProps].label} />
            ))}
          </Stack>
        </Radio.Group>

        <Group justify='center'>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            変換!
          </Button>
        </Group>
        <Group mt='sm' mb='sm'>
          <Title order={2}>生成結果</Title>
        </Group>

        <Stack gap='sm'>
          {form.values.result.words.map((x) => (
            <TextInput
              readOnly
              key={x.word}
              value={x.word.trim()}
              rightSectionPointerEvents='all'
              rightSection={
                <CopyButton value={x.word.trim()}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'コピーしました' : 'コピー'} withArrow position='left'>
                      <ActionIcon color={copied ? 'teal' : 'blue'} onClick={copy} size='input-sm'>
                        {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              }
            />
          ))}
        </Stack>
      </Box>
    </FormProvider>
  );
}
