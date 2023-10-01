'use client';

import { Paper, Stack, Alert, Box, Group, Text, Textarea, ActionIcon, ScrollArea, Flex } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';

export type MessageProps = {
  body: string
  role: 'user' | 'bot'
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
    <ScrollArea p={'xs'} type={'scroll'} h={height}>
      <Stack gap={'md'}>
        { messages.map(({ body, role }: MessageProps, index) => {
          return (
            <Box key={index}>
              <Group
                justify={role === 'bot' ? 'flex-start' : 'flex-end'}
              >
                <Message body={body}></Message>
              </Group>
            </Box>
          );
        })}
      </Stack>
    </ScrollArea>
  );
};
