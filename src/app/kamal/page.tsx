'use client';

import { Box } from '@mantine/core';
import { readStreamableValue } from 'ai/rsc';
import { useState } from 'react';
import { MessageInput, type MessageProps, Messages } from './Chat';
import { continueConversation } from './actions';

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

  // メッセージが送信されたときの処理
  const handleSubmit = async (input: string): Promise<void> => {
    // ユーザーのメッセージを追加
    setConversation([...conversation, { role: 'user', content: input }]);
    setIsResponding(true);

    const { messages, newMessage } = await continueConversation([...conversation, { role: 'user', content: input }]);

    let textContent = '';
    for await (const delta of readStreamableValue(newMessage)) {
      textContent = `${textContent}${delta}`;
      setConversation([...messages, { role: 'assistant', content: textContent }]);
    }
    setIsResponding(false);
  };

  return (
    <Box>
      <Messages messages={conversation} />
      <MessageInput onSendMessage={handleSubmit} isResponding={isResponding} />
    </Box>
  );
}
