'use client';

import { Paper, Stack, Box, Group, Text, ScrollArea, Space } from '@mantine/core';

export type MessageProps = {
  body: string
  role: 'human' | 'ai'
};

type ChatBoxProps = {
  messages: MessageProps[]
  height: string
  latestAiMessage: string
};

const Message = (props: { body: string, role: 'human' | 'ai' }) => {
  return (
    <Paper
      shadow="xs"
      radius="md"
      pt='6px'
      pb='6px'
      p='xs'
      bg={props.role === 'ai' ? 'white' : '#8de055'}
      c={'dark.6'}
    >
      <Text fz={'10px'} style={{ whiteSpace: 'pre-wrap' }}>{props.body}</Text>
    </Paper>
  );
};

export const ChatBox = ({ messages, height, latestAiMessage }: ChatBoxProps): JSX.Element => {
  const clonedMessages = structuredClone(messages);
  if (latestAiMessage !== '') {
    clonedMessages.push({ body: latestAiMessage, role: 'ai' });
  }
  return (
    <ScrollArea pt={0} pb={0} pr={'xs'} pl={'xs'} type={'scroll'} h={height} bg={'#7494c0'}>
      <Space h={'xs'}></Space>
      <Stack gap={'xs'}>
        { clonedMessages.map(({ body, role }: MessageProps, index) => {
          return (
            <Box key={index}>
              <Group
                justify={role === 'ai' ? 'flex-start' : 'flex-end'}
              >
                <Message body={body} role={role}></Message>
              </Group>
            </Box>
          );
        })}
      </Stack>
      <Space h={'md'}></Space>
    </ScrollArea>
  );
};
