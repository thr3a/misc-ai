import { Box, Button, Group, Paper, ScrollArea, Textarea } from '@mantine/core';
import { IconPlayerStop, IconSend } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MessageType = {
  role: 'user' | 'ai';
  content: string;
};

const Message = ({ message }: { message: MessageType }) => {
  return (
    <Paper
      pt={0}
      pb={0}
      pr={'xs'}
      pl={'xs'}
      radius='0'
      mb='xs'
      bg={message.role === 'user' ? 'red.1' : 'blue.1'}
      withBorder
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
    </Paper>
  );
};

// Messagesコンポーネント
// メッセージのリストを表示する
const Messages = ({ messages }: { messages: MessageType[] }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージが更新されたら、一番下までスクロールする
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  return (
    <ScrollArea h='80vh' type='always' bd='1px solid red' pt={0} pb={0} pr={'xs'} pl={'xs'}>
      {messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
};

// MessageInputコンポーネント
// メッセージの入力欄と送信ボタンを表示する
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

  // Shiftキー＋エンターキーで送信
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Group grow>
      <Textarea
        placeholder='メッセージを入力...'
        value={message}
        onChange={(event) => setMessage(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        autosize
        minRows={1}
        maxRows={4}
      />
      <Button onClick={handleSendMessage} disabled={isResponding} size='xl' radius='xl'>
        {isResponding ? <IconPlayerStop /> : <IconSend />}
      </Button>
    </Group>
  );
};

// Chatコンポーネント
// チャットUI全体を構成する
export const Chat = () => {
  const [messages, setMessages] = useState<MessageType[]>([
    { role: 'ai', content: 'こんにちは！\n\n何か質問はありますか？' }
  ]);
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
    <Box p='md'>
      <Messages messages={messages} />
      <MessageInput onSendMessage={handleSendMessage} isResponding={isResponding} />
    </Box>
  );
};
