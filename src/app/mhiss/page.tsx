'use client';
import { ChatBox } from '@/features/chat/ChatBox';
import type { MessageProps } from '@/features/chat/ChatBox';
import { TwitterButton } from '@/features/shareButton/Button';
import { ActionIcon, Box, Center, Flex, Textarea } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { getHotkeyHandler, useLocalStorage } from '@mantine/hooks';
import { IconSend } from '@tabler/icons-react';
import { readStreamableValue } from 'ai/rsc';
import { Description } from './Description';
import { continueConversation } from './actions';
import { DummyMessages } from './util';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type FormValues = {
  message: string;
  loading: boolean;
  messages: MessageProps[];
  count: number;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page() {
  const form = useForm({
    initialValues: {
      message: '今日は帰りが遅くなるね',
      // messages: DummyMessages(10),
      messages: [],
      loading: false,
      count: 0
    }
  });

  const handleSubmit = async (): Promise<void> => {
    // 5回以上送信した場合は送信不可
    if (form.values.count >= 5) {
      form.insertListItem('messages', { content: '上限に達しました。しばらくしてからまた来てね', role: 'assistant' });
      return;
    }
    if (form.values.message === '') return;
    if (form.values.loading) return;

    const tmp = form.values.message;
    form.setValues({ loading: true, message: '', count: form.values.count + 1 });
    form.insertListItem('messages', { content: form.values.message, role: 'user' } as MessageProps);

    const { messages, newMessage } = await continueConversation([
      ...form.values.messages,
      { role: 'user', content: tmp }
    ]);

    let textContent = '';

    for await (const delta of readStreamableValue(newMessage)) {
      textContent = `${textContent}${delta}`.replaceAll(/[「」｢｣]/g, '');
      form.setValues({ messages: [...messages, { role: 'assistant', content: textContent }] });
    }
    form.setValues({ message: '', loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box ml={0} mr={0} maw={'100vw'}>
        <ChatBox messages={form.values.messages} height='60vh' />
        <Flex align='center'>
          <Textarea
            placeholder='入力してください'
            autosize
            minRows={1}
            style={{ flex: 1, display: 'block' }}
            {...form.getInputProps('message')}
            onKeyDown={getHotkeyHandler([['mod+Enter', handleSubmit]])}
          />
          <ActionIcon size='input-sm' color='blue' onClick={handleSubmit} loading={form.values.loading}>
            <IconSend />
          </ActionIcon>
        </Flex>
        <Center mt={'md'} mb={'md'}>
          <TwitterButton url={'https://ai.turai.work/mhiss/'} description='お母さんヒス構文メーカー' />
        </Center>
        <Description />
      </Box>
    </FormProvider>
  );
}
