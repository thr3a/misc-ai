'use client';
import { createFormContext } from '@mantine/form';
import { Box, TextInput, Group, Button, Paper } from '@mantine/core';
import { type RequestProps } from '@/app/api/with-parser/route';
import { useState, useEffect } from 'react';
import { PromptTemplate } from 'langchain/prompts';
import { countryOutputParser } from '@/app/api/with-parser/schema';

type FormValues = {
  message: string
  loading: boolean
  result: any[]
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
      result: []
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ loading: true });

    const prompt = PromptTemplate.fromTemplate(`
      ### Task:
      与えられた日本語をより丁寧な日本語の表現に言い換えて候補を5つ列挙してください。
      ### Input: {text}
      ### Output:
    `);
    const formattedPrompt = await prompt.format({
      text: form.values.message
    });
    const params: RequestProps = {
      csrfToken,
      prompt: formattedPrompt,
      type: 'paraphrase'
    };
    const reqResponse = await fetch('/api/with-parser/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    if (reqResponse.ok) {
      const json = await reqResponse.json();
      form.setValues({ result: json.result, loading: false });
    } else {
      form.setValues({ result: ['エラーが発生しました'], loading: false });
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
          { form.values.result.map((item, index) => (
            <Box key={index}>
              { item.fields.Text }
            </Box>
          )) }
        </Paper>
      </Box>
    </FormProvider>
  );
}
