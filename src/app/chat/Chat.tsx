import { ActionIcon, Box, Group, Paper, ScrollArea, Space, Stack, Textarea } from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import { IconSend } from '@tabler/icons-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MessageProps = {
  role: 'user' | 'ai';
  content: string;
};

const dummyMessages: MessageProps[] = [
  {
    role: 'ai',
    content: '**こんにちは！** 何かお手伝いできることはありますか？\n\n\n[リンク](https://mantine.dev/)'
  },
  {
    role: 'user',
    content: 'Mantineについて教えてください。'
  },
  {
    role: 'ai',
    content:
      'Mantineは、ReactベースのUIコンポーネントライブラリです。\n- 美しいデザイン\n- 豊富なコンポーネント\n- カスタマイズ可能'
  }
];

const Message = ({ message }: { message: MessageProps }) => {
  return (
    <Paper pt='md' pb='md' pr={'xs'} pl={'xs'} radius='0' bg={message.role === 'user' ? 'red.1' : 'blue.1'} withBorder>
      <ReactMarkdown
        components={{
          p: Fragment
        }}
        remarkPlugins={[remarkGfm]}
      >
        {message.content}
      </ReactMarkdown>
    </Paper>
  );
};

// Messagesコンポーネント
// メッセージのリストを表示する
const Messages = ({ messages }: { messages: MessageProps[] }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージが更新されたら、一番下までスクロールする
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  return (
    <ScrollArea
      h='80vh'
      type='always'
      // bd='1px solid red'
      pt={0}
      pb={0}
      pr={'xs'}
      pl={'xs'}
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

const MessageInput = ({
  onSendMessage,
  isResponding
}: {
  onSendMessage: (message: string) => void;
  isResponding: boolean;
}) => {
  const [message, setMessage] = useState('');

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
        placeholder='メッセージを入力...'
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

export const Chat = () => {
  const [messages, setMessages] = useState<MessageProps[]>(dummyMessages);
  const [isResponding, setIsResponding] = useState(false);

  // メッセージが送信されたときの処理
  const handleSendMessage = (message: string) => {
    // ユーザーのメッセージを追加
    setMessages((prevMessages) => [...prevMessages, { role: 'user', content: message }]);
    setIsResponding(true);

    // ダミーの応答を生成
    setTimeout(() => {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'ai',
          content: `「**${message}**」についてですね。少々お待ちください...`
        }
      ]);
      setIsResponding(false);
    }, 1000);
  };

  return (
    <Box>
      <Messages messages={messages} />
      <MessageInput onSendMessage={handleSendMessage} isResponding={isResponding} />
    </Box>
  );
};
