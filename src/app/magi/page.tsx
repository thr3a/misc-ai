'use client';

import { useChat } from '@ai-sdk/react';
import { Box, Button, Group, Paper, ScrollArea, Stack, Text, Textarea } from '@mantine/core';
import { useInputState } from '@mantine/hooks';
import { DefaultChatTransport } from 'ai';
import { useEffect, useMemo, useRef } from 'react';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type TextPart = {
  type: 'text';
  text: string;
};

const roleLabels: Record<string, string> = {
  user: 'あなた',
  assistant: 'ハルヒ'
};

// 関数名は変えないこと
export default function Page() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useInputState('');

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/magi'
      }),
    []
  );

  const { messages, sendMessage, stop, status, error } = useChat({
    transport
  });
  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }
    setInput('');
    void sendMessage({
      parts: [{ type: 'text', text: trimmed }]
    });
  };

  const renderMessageContent = (textParts: TextPart[]) => textParts.map((part) => part.text).join('\n');

  return (
    <Box mx='auto' maw={420}>
      <Stack gap='md'>
        <Paper shadow='xs' p='sm' withBorder>
          <ScrollArea h='60vh' offsetScrollbars viewportRef={viewportRef} type='always'>
            <Stack gap='md'>
              {messages.length === 0 ? (
                <Text c='dimmed' ta='center'>
                  まずは挨拶から始めましょう。
                </Text>
              ) : (
                messages
                  .filter((message) => message.role !== 'system')
                  .map((message, index) => {
                    const label = roleLabels[message.role] ?? '不明';
                    const text = renderMessageContent(
                      message.parts.filter((part): part is TextPart => part.type === 'text')
                    );
                    return (
                      <Stack gap='0' key={message.id ?? `${message.role}-${index}`}>
                        <Text size='xs' c='dimmed'>
                          {label}
                        </Text>
                        <Text size='sm'>{text}</Text>
                      </Stack>
                    );
                  })
              )}
              {isLoading ? (
                <Text size='sm' c='dimmed'>
                  考え中...
                </Text>
              ) : null}
            </Stack>
          </ScrollArea>
        </Paper>

        {error ? (
          <Text c='red' size='sm'>
            エラーが発生しました: {error.message}
          </Text>
        ) : null}

        <Stack gap='0'>
          <Textarea
            placeholder='メッセージを入力'
            autosize
            minRows={2}
            maxRows={4}
            value={input}
            onChange={setInput}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          <Group justify='space-between'>
            <Button variant='subtle' onClick={() => stop()} disabled={!isLoading}>
              停止
            </Button>
            <Button onClick={handleSend} disabled={input.trim().length === 0} loading={isLoading}>
              送信
            </Button>
          </Group>
        </Stack>
      </Stack>
    </Box>
  );
}
