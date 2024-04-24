'use client';
import type { RequestProps } from '@/app/api/chat-stream/route';
import type { MessageProps } from '@/features/chat/ChatBox';
import { ChatBox } from '@/features/chat/ChatBox';
import { TwitterButton } from '@/features/shareButton/Button';
import { ActionIcon, Box, Center, Flex, Textarea } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { getHotkeyHandler, useLocalStorage } from '@mantine/hooks';
import { IconSend } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Description } from './Description';
import './style.css';
import { systemMessage } from './utils';

type FormValues = {
  messages: MessageProps[];
  message: string;
  loading: boolean;
  latestAiMessage: string;
  model: 'gpt-3.5-turbo' | 'gpt-4';
};
const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

const DummyMessages = (num: number): MessageProps[] => {
  const array: MessageProps[] = [];
  for (let index = 0; index < num; index++) {
    array.push({ body: 'こんにちは。', role: Math.random() >= 0.5 ? 'ai' : 'human' });
  }
  return array;
};

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
      // messages: DummyMessages(20),
      messages: [],
      message: '明日のテスト勉強ってやった？',
      loading: false,
      latestAiMessage: '',
      // model: 'gpt-4'
      model: 'gpt-3.5-turbo'
    }
  });
  const storageKey = 'jk' + dayjs().add(1, 'day').format('YYYYMMDD');
  const [count, setCount] = useLocalStorage<number>({
    key: storageKey,
    defaultValue: 0
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;
    count !== undefined && setCount(count + 1);
    if (count > 5) {
      form.setValues({ latestAiMessage: '1日のチャット上限数を超えました。明日またチャットしてね', loading: false });
      return;
    }
    const params: RequestProps = {
      csrfToken,
      message: form.values.message,
      systemMessage,
      history: form.values.messages,
      modelParams: {
        name: form.values.model,
        temperature: 1
      },
      aiPrefix: '女子高校生',
      humanPrefix: '友達'
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
      result = result.replace(/女子高校生:/, '');
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
        <Flex align='center'>
          <Textarea placeholder='入力してください' autosize minRows={1} style={{ flex: 1, display: 'block' }} {...form.getInputProps('message')} onKeyDown={getHotkeyHandler([['mod+Enter', handleSubmit]])} />
          <ActionIcon size={'lg'} color='blue' onClick={handleSubmit} loading={form.values.loading}>
            <IconSend></IconSend>
          </ActionIcon>
        </Flex>
        <Center mt={'md'} mb={'md'}>
          <TwitterButton url={'https://ai.turai.work/jkhiss/'} description='JKヒス構文メーカー'></TwitterButton>
        </Center>
        <Description></Description>
      </Box>
    </FormProvider>
  );
}
