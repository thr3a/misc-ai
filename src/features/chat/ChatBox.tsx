'use client';

import { Paper, Stack, Box, Group, Text, ScrollArea, Space } from '@mantine/core';

export type MessageProps = {
  body: string
  role: 'human' | 'ai'
};

type ChatBoxProps = {
  messages: MessageProps[]
  height: string
};

const Message = (props: { body: string }): JSX.Element => {
  return (
    <Paper shadow="xs" radius="md" pt='6px' pb='6px' p='xs' bg={'blue.1'} c={'dark.6'}>
      <Text fz={'10px'} style={{ whiteSpace: 'pre-wrap' }}>{props.body}</Text>
    </Paper>
  );
};

export function ChatBox ({ messages, height }: ChatBoxProps): JSX.Element {
  return (
    <ScrollArea pt={0} pb={0} pr={'xs'} pl={'xs'} type={'scroll'} h={height}>
      <Space h={'md'}></Space>
      <Stack gap={'md'}>
        { messages.map(({ body, role }: MessageProps, index) => {
          return (
            <Box key={index}>
              <Group
                justify={role === 'ai' ? 'flex-start' : 'flex-end'}
              >
                <Message body={body}></Message>
              </Group>
            </Box>
          );
        })}
      </Stack>
      <Space h={'md'}></Space>
    </ScrollArea>
  );
};
