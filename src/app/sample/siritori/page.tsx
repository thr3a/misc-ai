'use client';
import { createFormContext } from '@mantine/form';
import { type MessageProps } from '@/features/chat/ChatBox';
import { ChatBox } from '@/features/chat/ChatBox';
import { Box, Flex, Textarea, ActionIcon } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { getHotkeyHandler } from '@mantine/hooks';
import { type RequestProps } from '@/app/api/chat/route';
import { useState, useEffect } from 'react';

type FormValues = {
  messages: MessageProps[]
  message: string
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
      // messages: Array(20).fill([{ body: 'こんにちは。', role: 'ai' }]).flat(),
      messages: [],
      message: '',
      loading: false
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;
    const params: RequestProps = {
      csrfToken,
      message: form.values.message,
      systemMessage: 'あなたには優秀なアシスタントとして振る舞ってほしい。',
      history: form.values.messages
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
      <Box maw={'400px'} style={{ border: '1px solid #eee' }} ml={0} mah={'600px'}>
        <ChatBox messages={form.getInputProps('messages').value} height='60vh'></ChatBox>
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
            mt={'4px'}
            onClick={handleSubmit}
            loading={form.values.loading}
          >
            <IconSend></IconSend>
          </ActionIcon>
        </Flex>
      </Box>
    </FormProvider>
  );
}
