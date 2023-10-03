'use client';
import { createFormContext } from '@mantine/form';
import { Box, TextInput, Group, Button, Paper, CopyButton, Select } from '@mantine/core';
import { type RequestProps } from '@/app/api/with-parser/route';
import { useState, useEffect } from 'react';
import { PromptTemplate } from 'langchain/prompts';
import { type paraphraseSchema } from '@/app/api/with-parser/schema';
import { type z } from 'zod';
import { notifications } from '@mantine/notifications';

const contexts: Array<{ value: string, label: string, prompt: string }> = [
  { value: 'chat', label: 'LINEチャット', prompt: 'unformalなチャット' },
  { value: 'business_mail', label: 'ビジネスメール', prompt: 'ビジネスメール' },
  { value: 'unformal', label: '日常会話', prompt: '友達との日常会話' }
];

type FormValues = {
  message: string
  loading: boolean
  context: typeof contexts[number]['value']
  result: z.infer<typeof paraphraseSchema>
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
      message: '連絡ください',
      loading: false,
      result: [
        // { fields: { Text: 'こんにちは' } },
        // { fields: { Text: 'こんにちは' } }
      ],
      context: 'chat'
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ result: [], loading: true });

    const prompt = PromptTemplate.fromTemplate(`
      ### Task:
      あなたには最高品質の類語辞典として振る舞ってほしい。
      Input sentenceをContextに合った文章に変換し、指定されたフォーマットに従って候補を5つ列挙してください。
      ### Input sentence: {text}
      ### Context: {context}
      ### Output:
    `);
    const formattedPrompt = await prompt.format({
      text: form.values.message,
      context: contexts.find(x => x.value === form.values.context)?.prompt
    });
    console.log(formattedPrompt);
    const params: RequestProps = {
      csrfToken,
      prompt: formattedPrompt,
      type: 'paraphrase',
      modelParams: {
        name: 'gpt-4'
      }
    };
    const reqResponse = await fetch('/api/with-parser/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    if (reqResponse.ok) {
      const { result } = await reqResponse.json();
      form.setValues({ result, loading: false });
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
        <TextInput
          label="言い換えたいワード"
          {...form.getInputProps('message')}
        />
        <Select
          label="シチュエーション"
          data={contexts}
          checkIconPosition="right"
          {...form.getInputProps('context')}
        />
        <Group justify="flex-end">
          <Button onClick={handleSubmit} loading={form.values.loading}>変換!</Button>
        </Group>
        <Paper>
          { form.values.result.map((item, index) => (
            <Box key={index} mt={'md'}>
              <TextInput
                value={item.fields.Text} readOnly
                mb={0}
              />
              <CopyButton value={item.fields.Text}>
                {({ copied, copy }) => (
                  <Button color={copied ? 'teal' : 'blue'} onClick={copy}>
                    {copied ? 'コピーしました' : 'コピー'}
                  </Button>
                )}
              </CopyButton>
            </Box>
          )) }
        </Paper>
      </Box>
    </FormProvider>
  );
}
