import Link from 'next/link';
import { Button, ScrollArea, Box } from '@mantine/core';
import { headers } from 'next/headers';
import { ChatBox, type MessageProps } from '@/features/chat/ChatBox';

const messages: MessageProps[] = [
  {
    body: 'こんにちはボットさん',
    role: 'user'
  },
  {
    body: 'こんにちは、ユーザーさん',
    role: 'bot'
  }
];
const dummy = Array(20).fill(messages).flat();

export default function Page (): JSX.Element {
  const csrfToken = headers().get('X-CSRF-Token') ?? 'missing';

  return (
    <>
      <Box maw={'400px'} style={{ border: '1px solid #eee' }} ml={0}>
        <ChatBox messages={dummy}></ChatBox>
      </Box>
    </>
  );
}
