'use client';
import { createFormContext } from '@mantine/form';
import { Box, TextInput, Group, Button, Paper } from '@mantine/core';
import { type RequestProps } from '@/app/api/simple/route';
import { useState, useEffect } from 'react';
import { PromptTemplate } from 'langchain/prompts';

type FormValues = {
  message: string
  loading: boolean
  result: string
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
      message: 'こんにちは',
      loading: false,
      result: ''
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ loading: true });

    const prompt = PromptTemplate.fromTemplate(`
      ### Task:
      与えられた日本語をより丁寧な表現に変換してください。
      ### Input: {text}
      ### Output:
    `);
    const formattedPrompt = await prompt.format({
      text: form.values.message
    });
    const params: RequestProps = {
      csrfToken,
      prompt: formattedPrompt
    };
    const reqResponse = await fetch('/api/simple/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    if (reqResponse.ok) {
      const json = await reqResponse.json();
      form.setValues({ result: json.message, loading: false });
    } else {
      form.setValues({ result: 'エラーが発生しました', loading: false });
    }
  };

  return (
    <FormProvider form={form}>
      <Box maw={400} mx="auto" component="form">
        <TextInput
          label="言い換えたいワード"
          {...form.getInputProps('message')}
        />
        <Group justify="flex-end">
          <Button onClick={handleSubmit} loading={form.values.loading}>送信</Button>
        </Group>
        <Paper>
          { form.values.result }
        </Paper>
      </Box>
    </FormProvider>
  );
}
