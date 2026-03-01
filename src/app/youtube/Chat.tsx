import { ActionIcon, Box, Flex, Group, Paper, ScrollArea, Stack, Textarea } from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import { cjk } from '@streamdown/cjk';
import { IconSend } from '@tabler/icons-react';
import { useRef } from 'react';
import { Streamdown } from 'streamdown';

export type MessageProps = {
  role: 'user' | 'assistant';
  content: string;
};

const Message = ({ message }: { message: MessageProps }) => {
  const isUser = message.role === 'user';
  return (
    <Flex justify={isUser ? 'flex-end' : 'flex-start'}>
      <Paper
        p='sm'
        maw='90%'
        bg={isUser ? 'blue.6' : 'gray.1'}
        c={isUser ? 'white' : undefined}
        withBorder={!isUser}
        fz={'sm'}
      >
        <Streamdown
          plugins={{ cjk }}
          components={{
            p: ({ children }) => <Box style={{ margin: 0, padding: 0 }}>{children}</Box>,
            ul: ({ children }) => <ul style={{ paddingLeft: '10px' }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ paddingLeft: '10px' }}>{children}</ol>,
            strong: ({ children }) => <strong style={{ fontWeight: 'bold' }}>{children}</strong>
          }}
        >
          {message.content}
        </Streamdown>
      </Paper>
    </Flex>
  );
};

export const Messages = ({ messages }: { messages: MessageProps[] }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollArea h='80dvh' type='always' p={0}>
      <Stack gap={'sm'}>
        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
      </Stack>
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
};

export const MessageInput = ({
  onSendMessage,
  isResponding,
  value,
  onChange
}: {
  onSendMessage: (message: string) => void;
  isResponding: boolean;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) => {
  const handleSendMessage = () => {
    if (value.trim() !== '') {
      onSendMessage(value);
    }
  };

  return (
    <Group gap={'0'}>
      <Textarea
        w={'100%'}
        placeholder='聞きたい内容を入力してください'
        value={value}
        onChange={onChange}
        onKeyDown={getHotkeyHandler([['mod+Enter', handleSendMessage]])}
        autosize
        minRows={1}
        style={{ flex: 1, display: 'block' }}
      />
      <ActionIcon size='input-sm' variant='filled' color='blue' onClick={handleSendMessage} loading={isResponding}>
        <IconSend size={16} />
      </ActionIcon>
    </Group>
  );
};
