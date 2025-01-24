import { ActionIcon, Box, Group, Paper, ScrollArea, Space, Stack, Textarea } from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import { IconSend } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

export type MessageProps = {
  role: 'user' | 'assistant';
  content: string;
};

const Message = ({ message }: { message: MessageProps }) => {
  return (
    <Paper p={'xs'} radius='0' bg={message.role === 'user' ? 'red.1' : 'blue.1'} withBorder>
      <ReactMarkdown
        components={{
          p: ({ children }) => <Box style={{ margin: 0, padding: 0 }}>{children}</Box>,
          ul: ({ children }) => <ul style={{ paddingLeft: '10px' }}>{children}</ul>
        }}
        remarkPlugins={[remarkBreaks, remarkGfm]}
      >
        {message.content}
      </ReactMarkdown>
    </Paper>
  );
};

// Messagesコンポーネント
// メッセージのリストを表示する
export const Messages = ({ messages }: { messages: MessageProps[] }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージが更新されたら、一番下までスクロールする
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  return (
    <ScrollArea
      h='80dvh'
      type='always'
      // bd='1px solid red'
      p={0}
    >
      <Stack>
        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
        <Space h='md' />
      </Stack>
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
};

export const MessageInput = ({
  onSendMessage,
  isResponding
}: {
  onSendMessage: (message: string) => void;
  isResponding: boolean;
}) => {
  const [message, setMessage] = useState('最新版のrubyをインストールしたい');

  // 送信ボタンが押されたときの処理
  const handleSendMessage = () => {
    if (message.trim() !== '') {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <Group gap={'0'}>
      <Textarea
        w={'100%'}
        placeholder='メッセージを入力 Cmd+Enterで送信'
        value={message}
        onChange={(event) => setMessage(event.currentTarget.value)}
        onKeyDown={getHotkeyHandler([['mod+Enter', handleSendMessage]])}
        autosize
        minRows={1}
        style={{ flex: 1, display: 'block' }}
      />
      <ActionIcon size='input-sm' color='blue' onClick={handleSendMessage} loading={isResponding}>
        <IconSend />
      </ActionIcon>
    </Group>
  );
};
