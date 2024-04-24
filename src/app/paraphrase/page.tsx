'use client';
import type { RequestProps } from '@/app/api/with-parser/route';
import type { paraphraseSchema } from '@/app/api/with-parser/schema';
import { Box, Button, CopyButton, Group, Paper, Select, TextInput } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { PromptTemplate } from 'langchain/prompts';
import { useEffect, useState } from 'react';
import type { z } from 'zod';

const contexts: Array<{ value: string; label: string; prompt: string }> = [
  { value: 'casual', label: 'カジュアル', prompt: 'casual,friendly,in chat' },
  { value: 'business_mail', label: 'ビジネスメール', prompt: 'Business email, formal' },
  { value: 'osaka', label: '関西弁', prompt: '関西弁,kansai dialect,Kansai-ben' }
];

type FormValues = {
  message: string;
  loading: boolean;
  context: (typeof contexts)[number]['value'];
  result: z.infer<typeof paraphraseSchema>;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page(): JSX.Element {
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
      context: 'casual'
    }
  });

  const formatPrompt = (): PromptTemplate => {
    return PromptTemplate.fromTemplate(`
#Task
I want you to act as a thesaurus containing a variety of Japanese words.
Convert the indicated word into an accurate synonym, related word, or associated word using Style, and list 5 candidates according to the specified format.
Candidates should not be overlapping or monotonous.
#Language
Japanese
#Input
{text}
#Style
{context}`);
  };
  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ result: [], loading: true });

    const prompt = formatPrompt();
    const formattedPrompt = await prompt.format({
      text: form.values.message,
      context: contexts.find((x) => x.value === form.values.context)?.prompt
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
      <Box maw={400} mx='auto' component='form'>
        <TextInput label='言い換えたいワード・文章' {...form.getInputProps('message')} />
        <Select label='スタイル' data={contexts} checkIconPosition='right' {...form.getInputProps('context')} />
        <Group justify='flex-end'>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            変換!
          </Button>
        </Group>
        <Paper>
          {form.values.result.map((item, index) => (
            <Box key={index} mt={'md'}>
              <TextInput value={item.fields.Text} readOnly mb={0} />
              <CopyButton value={item.fields.Text}>
                {({ copied, copy }) => (
                  <Button color={copied ? 'teal' : 'blue'} onClick={copy}>
                    {copied ? 'コピーしました' : 'コピー'}
                  </Button>
                )}
              </CopyButton>
            </Box>
          ))}
        </Paper>
      </Box>
    </FormProvider>
  );
}
