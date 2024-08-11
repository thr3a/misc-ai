'use client';

import { Box, Group, Paper, ScrollArea, Space, Stack, Text } from '@mantine/core';

export type MessageProps = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatBoxProps = {
  messages: MessageProps[];
  height: string;
};

const Message = (props: { body: string; role: 'user' | 'assistant' }) => {
  return (
    <Paper
      shadow='xs'
      radius='md'
      pt='6px'
      pb='6px'
      p='xs'
      bg={props.role === 'user' ? 'white' : '#8de055'}
      c={'dark.6'}
    >
      <Text fz={'10px'} style={{ whiteSpace: 'pre-wrap' }}>
        {props.body}
      </Text>
    </Paper>
  );
};

export const ChatBox = ({ messages, height }: ChatBoxProps): JSX.Element => {
  // const clonedMessages = structuredClone(messages);
  return (
    <ScrollArea pt={0} pb={0} pr={'xs'} pl={'xs'} type={'scroll'} h={height} bg={'#7494c0'}>
      <Space h={'xs'} />
      <Stack gap={'xs'}>
        {messages.map(({ content, role }: MessageProps) => {
          return (
            <Box key={content}>
              <Group justify={role === 'assistant' ? 'flex-start' : 'flex-end'}>
                <Message body={content.trim()} role={role} />
              </Group>
            </Box>
          );
        })}
      </Stack>
      <Space h={'md'} />
    </ScrollArea>
  );
};
