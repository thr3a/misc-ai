'use client';
import './style.css';
import { createFormContext } from '@mantine/form';
import { type MessageProps } from '@/features/chat/ChatBox';
import { ChatBox } from '@/features/chat/ChatBox';
import { Box, Flex, Textarea, ActionIcon, Center } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { getHotkeyHandler } from '@mantine/hooks';
import { type RequestProps } from '@/app/api/chat-stream/route';
import { useState, useEffect } from 'react';
import { TwitterButton } from '@/features/shareButton/Button';
import { systemMessage } from './utils';

type FormValues = {
  messages: MessageProps[]
  message: string
  loading: boolean
  latestAiMessage: string
};
const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

const DummyMessages = (num: number): MessageProps[] => {
  const array: MessageProps[] = [];
  for (let index = 0; index < num; index++) {
    array.push({ body: 'こんにちは。', role: Math.random() >= 0.5 ? 'ai' : 'human' });
  }
  return array;
};

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
      // messages: DummyMessages(20),
      messages: [],
      message: '今日は帰りが遅くなるね',
      loading: false,
      latestAiMessage: ''
    }
  });

  useEffect(() => {
    form.setValues({ messages: form.values.messages });
  }, [form.values]);

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;
    const params: RequestProps = {
      csrfToken,
      message: form.values.message,
      systemMessage,
      history: form.values.messages,
      modelParams: {
        // name: 'gpt-4',
        temperature: 1
      }
    };
    form.setValues({ loading: true, message: '' });
    form.insertListItem('messages', { body: form.values.message, role: 'human' });
    const res = await fetch('/api/chat-stream/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    if (res.body === null) throw new Error('res.body is null');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const decodedValue = decoder.decode(value, { stream: true });
      result += decodedValue;
      form.setValues({ latestAiMessage: result });
    }
    reader.releaseLock();
    form.insertListItem('messages', { body: result, role: 'ai' });
    form.setValues({ latestAiMessage: '', loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box ml={0} mr={0} maw={'100vw'}>
        <ChatBox messages={form.values.messages} height='60vh' latestAiMessage={form.values.latestAiMessage} />
        <Flex align="center">
          <Textarea
            placeholder="入力してください"
            autosize
            minRows={1}
            style={{ flex: 1, display: 'block' }}
            {...form.getInputProps('message')}
            onKeyDown={getHotkeyHandler([
              ['mod+Enter', handleSubmit]
            ])}
          />
          <ActionIcon
            size={'lg'}
            color="blue"
            onClick={handleSubmit}
            loading={form.values.loading}
          >
            <IconSend></IconSend>
          </ActionIcon>
        </Flex>
        <Center>
          <TwitterButton url={'https://ai.turai.work/mhiss/'} description='お母さんヒス構文メーカー'></TwitterButton>
        </Center>
      </Box>
    </FormProvider>
  );
}
