'use client';

import { useChat } from '@ai-sdk/react';
import { Alert, Paper, Stack } from '@mantine/core';
import { DefaultChatTransport, type FileUIPart } from 'ai';
import { useMemo } from 'react';
import { ChatHeader, MessageInput, Messages } from './Chat';

// 関数名は変えないこと
export default function Page() {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/example-chat'
      }),
    []
  );

  const { messages, sendMessage, status, stop, error, regenerate, setMessages } = useChat({ transport });

  const handleSubmit = (input: string, files: FileUIPart[] = []) => {
    // 画像のみ送信時に空のテキストパートを作らないよう、テキストの有無で分岐する
    if (input.trim() === '') {
      sendMessage({ files });
      return;
    }
    sendMessage({ text: input, files });
  };

  const handleReset = () => {
    stop();
    setMessages([]);
  };

  return (
    <Paper withBorder shadow='md' mb='md' style={{ overflow: 'hidden' }}>
      <Stack gap={0} h='calc(100dvh - 150px)' mih={480}>
        <ChatHeader messages={messages} status={status} onReset={handleReset} />
        <Messages
          messages={messages}
          status={status}
          onRegenerate={() => regenerate()}
          onSuggestion={(text) => handleSubmit(text)}
        />
        {error && (
          <Alert color='red' variant='light' title='エラーが発生しました'>
            {error.message}
          </Alert>
        )}
        <MessageInput onSendMessage={handleSubmit} onStop={stop} status={status} />
      </Stack>
    </Paper>
  );
}
