'use client';

import { Box, Textarea } from '@mantine/core';
import { readStreamableValue } from 'ai/rsc';
import { useState } from 'react';
import { MessageInput, type MessageProps, Messages } from './Chat';
import { continueConversation } from './actions';
import { fetchTranscript } from './util';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export default function Home() {
  const [conversation, setConversation] = useState<MessageProps[]>([
    {
      role: 'assistant',
      content: 'こんにちは！ **みかん**さん！'
    }
  ]);
  const [isResponding, setIsResponding] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcript, setTranscript] = useState('');

  const handleFetchTranscript = async () => {
    const result = await fetchTranscript(youtubeUrl);
    if (result.status === 'ok') {
      setTranscript(result.transcribed);
    } else {
      setTranscript('字幕の取得に失敗しました');
    }
  };

  // メッセージが送信されたときの処理
  const handleSubmit = async (input: string): Promise<void> => {
    const updatedConversation: MessageProps[] = [...conversation, { role: 'user', content: input }];
    // ユーザーのメッセージを追加
    setConversation(updatedConversation);
    setIsResponding(true);

    const { messages, newMessage } = await continueConversation(updatedConversation);

    let textContent = '';
    for await (const delta of readStreamableValue(newMessage)) {
      textContent = `${textContent}${delta}`;
      setConversation([...messages, { role: 'assistant', content: textContent }]);
    }
    setIsResponding(false);
  };

  return (
    <Box>
      <Textarea value={transcript} readOnly minRows={5} />

      <Messages messages={conversation} />
      <MessageInput onSendMessage={handleSubmit} isResponding={isResponding} />
    </Box>
  );
}
