'use client';

import { Box, Button, TextInput, Textarea } from '@mantine/core';
import { readStreamableValue } from 'ai/rsc';
import { useState } from 'react';
import { MessageInput, type MessageProps, Messages } from './Chat';
import { continueConversation, fetchTranscript } from './actions';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export default function Home() {
  const [conversation, setConversation] = useState<MessageProps[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('https://www.youtube.com/watch?v=xaY01JIAcCI');
  const [transcript, setTranscript] = useState('');

  const handleFetchTranscript = async () => {
    const result = await fetchTranscript(youtubeUrl);
    if (result.status === 'ok') {
      setTranscript(result.title + result.transcribed);
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

    const { messages, newMessage } = await continueConversation(transcript, updatedConversation);

    let textContent = '';
    for await (const delta of readStreamableValue(newMessage)) {
      textContent = `${textContent}${delta}`;
      setConversation([...messages, { role: 'assistant', content: textContent }]);
    }
    setIsResponding(false);
  };

  return (
    <Box>
      <TextInput
        placeholder='YouTubeのURLを入力'
        value={youtubeUrl}
        onChange={(event) => setYoutubeUrl(event.currentTarget.value)}
      />
      <Button onClick={handleFetchTranscript}>字幕を取得</Button>
      <Textarea value={transcript} readOnly minRows={5} />
      <MessageInput onSendMessage={handleSubmit} isResponding={isResponding} />
      <Messages messages={conversation} />
    </Box>
  );
}
