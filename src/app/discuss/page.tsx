'use client';
import { createFormContext } from '@mantine/form';
import { Box, Group, Button, TextInput, Title } from '@mantine/core';
import { type RequestProps } from '@/app/api/chat-stream/route';
import { useState, useEffect } from 'react';
import { PromptTemplate } from 'langchain/prompts';

type FormValues = {
  topic: string
  result: string
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
      topic: '最強のアイスクリームの味',
      result: '',
      loading: false,
      results: ['']
    }
  });

  async function fetchAPI (params: RequestProps): Promise<string> {
    let resultMessage = '';
    const res = await fetch('http://localhost:3000/api/chat-stream/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    if (res.body === null) throw new Error('res.body is null');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const decodedValue = decoder.decode(value, { stream: true });
      resultMessage += decodedValue;
      form.setValues({ result: resultMessage });
    }
    reader.releaseLock();
    return resultMessage;
  }

  const handleSubmit = async (): Promise<void> => {
    if (form.values.topic === '') return;
    if (form.values.loading) return;

    form.setValues({ results: [], loading: true });

    const prompt = PromptTemplate.fromTemplate(`
# Task
$TOPIC について熱いパッションで語ってください。
# TOPIC
{topic}
`);
    const formattedPrompt = await prompt.format({ prompt, topic: form.values.topic });
    console.log(formattedPrompt);
    const params: RequestProps = {
      csrfToken,
      history: [],
      message: formattedPrompt,
      systemMessage: '',
      modelParams: {
        // name: 'gpt-4',
        temperature: 0
      }
    };
    const result = await fetchAPI(params);
    form.setValues({ loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box maw={400} mx="auto" component="form">
        <TextInput label='議題' withAsterisk {...form.getInputProps('topic')}/>
        <Group justify="center">
          <Button onClick={handleSubmit} loading={form.values.loading}>送信</Button>
        </Group>
        <Group mt="sm" mb="sm">
          <Title order={2}>生成結果</Title>
        </Group>

        {form.values.result}

      </Box>
    </FormProvider>
  );
}
