'use client';
import './style.css';
import { createFormContext } from '@mantine/form';
import { type MessageProps } from '@/features/chat/ChatBox';
import { ChatBox } from '@/features/chat/ChatBox';
import { Box, Flex, Textarea, ActionIcon, Center } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { getHotkeyHandler } from '@mantine/hooks';
import { type RequestProps } from '@/app/api/chat/route';
import { useState, useEffect } from 'react';
import { TwitterButton } from '@/features/shareButton/Button';
import { systemMessage } from './utils';

type FormValues = {
  messages: MessageProps[]
  message: string
  loading: boolean
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
      loading: false
    }
  });

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
    const reqResponse = await fetch('/api/chat/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    if (reqResponse.ok) {
      const json = await reqResponse.json();
      form.insertListItem('messages', { body: json.message, role: 'ai' });
    } else {
      form.insertListItem('messages', { body: 'エラーが発生しました。', role: 'ai' });
    }
    form.setValues({ loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box ml={0} mr={0} maw={'100vw'}>
        <ChatBox messages={form.getInputProps('messages').value} height='74vh'></ChatBox>
        <Flex>
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
            variant={'outline'}
            color="blue"
            mt={'3px'}
            onClick={handleSubmit}
            loading={form.values.loading}
          >
            <IconSend></IconSend>
          </ActionIcon>
        </Flex>
        <Center>
          <TwitterButton url={'location.href'} description='お母さんヒス構文メーカー'></TwitterButton>
        </Center>
      </Box>
    </FormProvider>
  );
}
