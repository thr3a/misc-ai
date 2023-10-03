'use client';
import './style.css';
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
      // messages: [],
      messages: [{ body: 'では始めましょう。「りんご」 次は「ご」から始まる単語を考えてください。', role: 'ai' }],
      message: '',
      loading: false
    }
  });

  const systemMessage = `
  しりとりとは、単語をつなげていくゲームです。しりとりのルールは以下の通りです。
  - 最初の参加者は、任意の単語を言います。
  - 次の参加者は、前の参加者が言った単語の最後の文字から始まる単語を言います。
  - 以降、同じようにして単語をつなげていきます。
  - すでに使われた単語や最後が「ん」で終わる単語を言った場合は、その参加者は負けです。
  - 負けた参加者が出るまで続けます。
  Humanとしりとりをして勝ち続けてください。ではゲームを始めましょう。
  `;

  // const systemMessage = `
  // Humanとゲームをしてください。

  // ### ゲームのルール
  // - ゲームの参加者はHumanとAIの2人のみです。あなたはAIです。
  // - あなたは最後にHumanから与えられたワードの「発音の最後の文字」から始まるワードを考えて出力してください。
  // ただし以下の条件を満たすワードを出力する必要があります。
  //   - 「発音の最後の文字」が「ん」で終わらないこと
  //   - 辞書に存在するワードであること
  //   - ゲーム内で既に出力されたワードでないこと
  //   - 相手の最後のワードの「発音の最後の文字」と同じ文字から始まるワードであること
  // - Humanも同様にAIの最後のワードの「発音の最後の文字」から始まるワードを考えて出力していきます。
  // - 条件を満たさないワードを出力した場合、そのプレイヤーの負けとなります。
  // - どちらかが負けた時点でゲームは終了です。

  // あなたはこの条件を満たしたワードを出力し続けてHumanに勝たなければいけません。ではゲームを始めましょう。
  // `;

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;
    const params: RequestProps = {
      csrfToken,
      message: form.values.message,
      systemMessage,
      history: form.values.messages,
      modelParams: {
        temperature: 0.1
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
            mt={'3px'}
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
