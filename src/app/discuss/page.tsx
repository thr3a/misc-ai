'use client';
import { createFormContext } from '@mantine/form';
import { Box, Group, Button, TextInput, Title, Paper, Text, Stack } from '@mantine/core';
import { type RequestProps } from '@/app/api/chat-stream/route';
import { useState, useEffect } from 'react';
import { initPrompt, loopPrompt } from '@/app/discuss/utils';

type FormValues = {
  topic: string
  latestMessage: string
  messages: string[]
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
      latestMessage: '',
      messages: [],
      loading: false
    }
  });

  async function fetchAPI (params: RequestProps): Promise<string> {
    let result = '';
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
      result += decodedValue;
      form.setValues({ latestMessage: result });
    }
    reader.releaseLock();
    const array = form.values.messages;
    array.push(result);
    form.setValues({ latestMessage: '', messages: array });
    return result;
  }

  const handleSubmit = async (): Promise<void> => {
    // 初回ここから
    if (form.values.topic === '') return;
    if (form.values.loading) return;
    form.setValues({ latestMessage: '', messages: [], loading: true });
    const params: RequestProps = {
      csrfToken,
      history: [],
      message: initPrompt(form.values.topic),
      systemMessage: '',
      modelParams: {
        // name: 'gpt-4',
        temperature: 1
      }
    };
    await fetchAPI(params);
    // 初回ここまで
    let count = 1;
    while (true) {
      const params: RequestProps = {
        systemMessage: loopPrompt(form.values.topic),
        message: form.values.messages[form.values.messages.length - 1],
        history: [],
        modelParams: {
          temperature: 1,
          max_tokens: 1024,
          name: 'gpt-3.5-turbo'
          // name: 'gpt-4'
        }
      };
      await fetchAPI(params);
      if (count === 3) {
        form.setValues({ loading: false });
        break;
      };
      count++;
    }
  };

  return (
    <FormProvider form={form}>
      <Box maw={800} mx="auto" component="form">
        <TextInput label='議題' withAsterisk {...form.getInputProps('topic')}/>
        <Group justify="center">
          <Button onClick={handleSubmit} loading={form.values.loading} color={'orange'}>議論開始</Button>
        </Group>
        <Group mt="sm" mb="sm">
          <Title order={2}>生成結果</Title>
        </Group>
        <Stack>
          {form.values.messages.map((message, index) => (
            <Paper shadow="xs" p='sm' withBorder key={index}>
              <Text size='xs'>
                {message}
              </Text>
            </Paper>
          ))}
        </Stack>
        {form.values.latestMessage !== '' &&
          <Paper shadow="xs" p='sm' withBorder mt={'md'}>
            <Text size='xs'>
              {form.values.latestMessage}
            </Text>
          </Paper>
        }
      </Box>
    </FormProvider>
  );
}
