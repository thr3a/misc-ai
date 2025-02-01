'use client';

import { Box, Button, Center, Group, LoadingOverlay, Textarea } from '@mantine/core';
import { readStreamableValue } from 'ai/rsc';
import { useState } from 'react';
import { MessageInput, type MessageProps, Messages } from './Chat';
import { continueConversation, fetchTranscript } from './actions';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export default function YoutubePage() {
  const [conversation, setConversation] = useState<MessageProps[]>([
    {
      role: 'assistant',
      content: 'こんにちは！ **みかん**さん！この動画についてなんでも聞いてね！'
    }
  ]);
  const [isResponding, setIsResponding] = useState(false);
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // メッセージが送信されたときの処理
  const handleSubmit = async (input: string): Promise<void> => {
    const updatedConversation: MessageProps[] = [...conversation, { role: 'user', content: input }];
    // ユーザーのメッセージを追加
    setConversation(updatedConversation);
    setIsResponding(true);

    const { messages, newMessage } = await continueConversation(updatedConversation, transcript);

    let textContent = '';
    for await (const delta of readStreamableValue(newMessage)) {
      textContent = `${textContent}${delta}`;
      setConversation([...messages, { role: 'assistant', content: textContent }]);
    }
    setIsResponding(false);
  };

  const handleGetTranscript = async () => {
    setIsLoading(true);
    try {
      const res = await fetchTranscript(url);
      setTranscript(res.result);
    } catch (e: any) {
      console.error(e);
    }
    setIsLoading(false);
  };

  return (
    <Box>
      <Group>
        <Textarea
          w={'100%'}
          placeholder='youtubeのURLを入力...'
          value={url}
          onChange={(event) => setUrl(event.currentTarget.value)}
          autosize
          minRows={1}
          style={{ flex: 1, display: 'block' }}
        />
        <Button onClick={handleGetTranscript} loading={isLoading}>
          取得
        </Button>
      </Group>
      <LoadingOverlay visible={isLoading} />
      {transcript !== '' && (
        <>
          <Textarea w={'100%'} value={transcript} autosize minRows={3} readOnly />
          <Messages messages={conversation} />
          <MessageInput onSendMessage={handleSubmit} isResponding={isResponding} />
        </>
      )}
    </Box>
  );
}
