'use client';

import { Box } from '@mantine/core';
import { readStreamableValue } from 'ai/rsc';
import { useState } from 'react';
import { MessageInput, type MessageProps, Messages } from './Chat';
import { continueConversation } from './actions';
import { appName } from './util';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export default function Home() {
  const [conversation, setConversation] = useState<MessageProps[]>([]);
  const [isResponding, setIsResponding] = useState(false);

  // メッセージが送信されたときの処理
  const handleSubmit = async (input: string): Promise<void> => {
    const updatedConversation: MessageProps[] = [
      ...conversation,
      { role: 'user', content: `${appName}について質問です。${input}` }
    ];
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
      <MessageInput onSendMessage={handleSubmit} isResponding={isResponding} />
      <Messages messages={conversation} />
    </Box>
  );
}
