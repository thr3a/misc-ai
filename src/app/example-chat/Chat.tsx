import { ActionIcon, Box, Flex, Group, Paper, ScrollArea, Stack, Textarea } from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import { cjk } from '@streamdown/cjk';
import { IconPlayerStop, IconSend } from '@tabler/icons-react';
import type { UIMessage } from 'ai';
import { useRef } from 'react';
import { Streamdown } from 'streamdown';

const collectText = (parts: UIMessage['parts']) =>
  parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text' && 'text' in part)
    .map((part) => part.text)
    .join('\n');

const Message = ({ message }: { message: UIMessage }) => {
  const isUser = message.role === 'user';
  return (
    <Flex justify={isUser ? 'flex-end' : 'flex-start'}>
      <Paper
        p='xs'
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
          {collectText(message.parts)}
        </Streamdown>
      </Paper>
    </Flex>
  );
};

export const Messages = ({ messages }: { messages: UIMessage[] }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollArea h='80dvh' type='always' p={0}>
      <Stack gap={'xs'}>
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
      </Stack>
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
};

export const MessageInput = ({
  onSendMessage,
  onStop,
  isResponding,
  value,
  onChange
}: {
  onSendMessage: (message: string) => void;
  onStop: () => void;
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
        placeholder='メッセージを入力してください'
        value={value}
        onChange={onChange}
        onKeyDown={getHotkeyHandler([['mod+Enter', handleSendMessage]])}
        autosize
        minRows={1}
        style={{ flex: 1, display: 'block' }}
      />
      {isResponding ? (
        <ActionIcon size='input-sm' variant='filled' color='red' onClick={onStop}>
          <IconPlayerStop size={16} />
        </ActionIcon>
      ) : (
        <ActionIcon size='input-sm' variant='filled' color='blue' onClick={handleSendMessage}>
          <IconSend size={16} />
        </ActionIcon>
      )}
    </Group>
  );
};
