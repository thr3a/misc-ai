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
  { value: 'null', label: '指定なし', prompt: '' },
  { value: 'chat', label: 'LINEチャット', prompt: 'informal chat' },
  { value: 'business_mail', label: 'ビジネスメール', prompt: 'Business mail' },
  { value: 'unformal', label: '日常会話', prompt: 'informal talk' }
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
      context: 'null'
    }
  });

  const formatPrompt = (): PromptTemplate => {
    if (form.values.context === 'null') {
      return PromptTemplate.fromTemplate(`
### Role:
あなたには多様な日本語が収録された類語辞典として振る舞ってほしい。
### Task:
Inputの内容をもっと的確な言い回しの類語、関連語、連想されるワードを指定されたフォーマットに従って5つ候補を列挙してください。
候補は重複したり単調になってはいけません。
### Input: {text}
### Output:`);
    } else {
      return PromptTemplate.fromTemplate(`
### Role:
あなたには多様な日本語が収録された類語辞典として振る舞ってほしい。
### Task:
Inputの内容をContextに適した的確な言い回しの類語、関連語、連想されるワードに変換し、指定されたフォーマットに従って5つ候補を列挙してください。
候補は重複したり単調になってはいけません。
### Context: {context}
### Input: {text}
### Output:`);
    }
  };
  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ result: [], loading: true });

    const prompt = formatPrompt();
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
          label="言い換えたいワード・文章"
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
