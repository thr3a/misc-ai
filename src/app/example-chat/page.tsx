'use client';

import { useChat } from '@ai-sdk/react';
import { Box, Stack } from '@mantine/core';
import { useInputState } from '@mantine/hooks';
import { DefaultChatTransport } from 'ai';
import { useMemo } from 'react';
import { MessageInput, Messages } from './Chat';

// 関数名は変えないこと
export default function Page() {
  const [messageInputValue, setMessageInputValue] = useInputState('');

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/example-chat'
      }),
    []
  );

  const { messages, sendMessage, status, stop } = useChat({ transport });

  const isResponding = status === 'streaming' || status === 'submitted';

  const handleSubmit = (input: string) => {
    sendMessage({ parts: [{ type: 'text', text: input }] });
    setMessageInputValue('');
  };

  return (
    <Box bd='1px solid gray.3' p='xs'>
      <Stack gap='sm'>
        <Messages messages={messages} />
        <MessageInput
          onSendMessage={handleSubmit}
          onStop={stop}
          isResponding={isResponding}
          value={messageInputValue}
          onChange={(event) => setMessageInputValue(event)}
        />
      </Stack>
    </Box>
  );
}
