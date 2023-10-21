'use client';
import { createFormContext } from '@mantine/form';
import { Box, Group, Button, TextInput, Stack, Title, CopyButton } from '@mantine/core';
import { type RequestProps } from '@/app/api/list-parser/route';
import { useState, useEffect } from 'react';
import { PromptTemplate } from 'langchain/prompts';
import { notifications } from '@mantine/notifications';
import { IconClipboardCopy, IconCheck } from '@tabler/icons-react';

type FormValues = {
  message: string
  results: string[]
  loading: boolean
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page (): JSX.Element {
  const [csrfToken, setCsrfToken] = useState<string>('loading...');
  useEffect(() => {
    const el = document.querySelector('meta[name="x-csrf-token"]');
    if (el !== null) {
      setCsrfToken(el.getAttribute('content') ?? 'missing');
    }
  }, []);
  const form = useForm({
    initialValues: {
      message: 'やっほー',
      loading: false,
      results: ['']
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ results: [], loading: true });

    const prompt = PromptTemplate.fromTemplate(`
# Task
messageに対する返信候補を5つ作成してください。
# Message
{message}
`);
    const formattedPrompt = await prompt.format({ prompt, message: form.values.message });
    console.log(formattedPrompt);
    const params: RequestProps = {
      csrfToken,
      prompt: formattedPrompt,
      modelParams: {
        // name: 'gpt-4',
        temperature: 0
      }
    };
    const reqResponse = await fetch('/api/list-parser/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    if (reqResponse.ok) {
      const { result } = await reqResponse.json();
      form.setValues({ results: result, loading: false });
    } else {
      notifications.show({
        title: 'エラーが発生しました。',
        message: '再度試してみてください',
        withCloseButton: false,
        color: 'red'
      });
      form.setValues({ loading: false });
    }
  };

  return (
    <FormProvider form={form}>
      <Box maw={400} mx="auto" component="form">
        <TextInput label='メッセージ' withAsterisk {...form.getInputProps('message')}/>
        <Group justify="center">
          <Button onClick={handleSubmit} loading={form.values.loading}>送信</Button>
        </Group>
        <Group mt="sm" mb="sm">
          <Title order={2}>生成結果</Title>
        </Group>

        <Stack gap="sm">
          {form.values.results.map((candidate, index) => (
            <TextInput
              readOnly
              key={index}
              value={candidate.trim()}
              rightSectionPointerEvents="all"
              rightSection={
                <CopyButton value={candidate.trim()}>
                  {({ copied, copy }) => (
                    <Button
                      color={copied ? 'teal' : 'blue'}
                      onClick={copy}
                    >
                      {copied ? <IconCheck size={18} /> : <IconClipboardCopy size={18} />}
                    </Button>
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
