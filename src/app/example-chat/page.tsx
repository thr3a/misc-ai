'use client';

import { useChat } from '@ai-sdk/react';
import { Alert, Paper, Stack } from '@mantine/core';
import { DefaultChatTransport } from 'ai';
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

  const handleSubmit = (input: string) => {
    sendMessage({ text: input });
  };

  const handleReset = () => {
    stop();
    setMessages([]);
  };

  return (
    <Paper withBorder shadow='md' mb='md' style={{ overflow: 'hidden' }}>
      <Stack gap={0} h='calc(100dvh - 150px)' mih={480}>
        <ChatHeader messages={messages} status={status} onReset={handleReset} />
        <Messages messages={messages} status={status} onRegenerate={() => regenerate()} onSuggestion={handleSubmit} />
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
