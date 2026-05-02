'use client';

import { useChat } from '@ai-sdk/react';
import { Carousel } from '@mantine/carousel';
import { Badge, Button, Divider, Group, Paper, Skeleton, Stack, Text, Textarea } from '@mantine/core';
import { useInputState } from '@mantine/hooks';
import { DefaultChatTransport } from 'ai';
import { memo, useEffect, useMemo, useRef } from 'react';
import type { ModelDefinition, ModelKey } from '@/app/magi/util';

// broadcastのたびにidをインクリメントし、同じ質問文でも再送信できるようにする
export type BroadcastPayload = { text: string; id: number } | null;

type ModelStatus = '待機中' | '生成中' | '応答済み' | 'エラー';

const STATUS_COLORS: Record<ModelStatus, string> = {
  待機中: 'dark.8',
  生成中: 'blue',
  応答済み: 'teal',
  エラー: 'red'
};

const useModelChat = (modelId: ModelKey) => {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/magi/chat',
        body: { modelId }
      }),
    [modelId]
  );

  return useChat({
    id: `magi-${modelId}`,
    transport
  });
};

type ModelChatInstance = ReturnType<typeof useModelChat>;

const getModelStatus = (
  status: ModelChatInstance['status'],
  hasAssistantReply: boolean,
  hasError: boolean
): ModelStatus => {
  if (hasError) return 'エラー';
  if (status === 'submitted' || status === 'streaming') return '生成中';
  if (hasAssistantReply) return '応答済み';
  return '待機中';
};

const collectText = (parts: Array<{ type: string; text?: string }>) =>
  parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text' && 'text' in part)
    .map((part) => part.text)
    .join('\n');

export type ModelSlideProps = {
  definition: ModelDefinition;
  broadcast: BroadcastPayload;
  onCompleted: (modelId: ModelKey, response: string) => void;
  onError: (modelId: ModelKey) => void;
  onRetry: (modelId: ModelKey) => void;
};

export const ModelSlide = memo(({ definition, broadcast, onCompleted, onError, onRetry }: ModelSlideProps) => {
  const chat = useModelChat(definition.id);
  const [followUpInput, setFollowUpInput] = useInputState('');
  const lastProcessedBroadcastId = useRef<number>(-1);
  const completionNotifiedRef = useRef(false);
  const errorNotifiedRef = useRef(false);

  // broadcastが変化したらメッセージを送信
  useEffect(() => {
    if (broadcast && broadcast.id !== lastProcessedBroadcastId.current) {
      lastProcessedBroadcastId.current = broadcast.id;
      completionNotifiedRef.current = false;
      errorNotifiedRef.current = false;
      void chat.sendMessage({ parts: [{ type: 'text', text: broadcast.text }] });
    }
  }, [broadcast, chat.sendMessage]);

  const hasAssistantReply = chat.messages.some((message) => message.role === 'assistant');
  const isGenerating = chat.status === 'streaming' || chat.status === 'submitted';
  const status = getModelStatus(chat.status, hasAssistantReply, !!chat.error);
  const visibleMessages = chat.messages.filter((message) => message.role !== 'system');
  const displayMessages = visibleMessages.filter((_, i) => !(i === 0 && visibleMessages[0]?.role === 'user'));
  const lastMessage = chat.messages[chat.messages.length - 1];
  const isWaitingForText =
    isGenerating && (!lastMessage || lastMessage.role !== 'assistant' || collectText(lastMessage.parts).length === 0);

  // 完了時に親へ最初のアシスタント応答を通知（1回のbroadcastにつき1回だけ実行）
  useEffect(() => {
    if (!broadcast) {
      completionNotifiedRef.current = false;
      return;
    }
    if (hasAssistantReply && !isGenerating && !completionNotifiedRef.current) {
      completionNotifiedRef.current = true;
      const assistantMessage = chat.messages.find((m) => m.role === 'assistant');
      const response = assistantMessage ? collectText(assistantMessage.parts) : '';
      onCompleted(definition.id, response);
    }
  }, [hasAssistantReply, isGenerating, broadcast, chat.messages, definition.id, onCompleted]);

  // エラー発生時に親へ通知（1回のbroadcastにつき1回だけ実行）
  useEffect(() => {
    if (chat.error && broadcast && !errorNotifiedRef.current) {
      errorNotifiedRef.current = true;
      onError(definition.id);
    }
  }, [chat.error, broadcast, definition.id, onError]);

  const handleRetry = () => {
    if (!broadcast) return;
    completionNotifiedRef.current = false;
    onRetry(definition.id);
    chat.setMessages([]);
    void chat.sendMessage({ parts: [{ type: 'text', text: broadcast.text }] });
  };

  const handleFollowUpSend = () => {
    if (!followUpInput) return;
    const text = followUpInput;
    setFollowUpInput('');
    void chat.sendMessage({ parts: [{ type: 'text', text }] });
  };

  return (
    <Carousel.Slide>
      <Paper withBorder p='sm' h='100%' mih={'200px'}>
        <Stack gap='sm' h='100%'>
          <Group justify='space-between' align='flex-start'>
            <Group gap='xs'>
              <Text fw='bold'>{definition.label}</Text>
              <Badge variant='light' color={STATUS_COLORS[status]}>
                {status}
              </Badge>
            </Group>
            <Button size='xs' color='red' onClick={() => chat.stop()} disabled={!isGenerating}>
              停止
            </Button>
          </Group>

          {chat.error ? (
            <Stack gap='xs'>
              <Text size='sm' c='red'>
                エラー: {chat.error.message}
              </Text>
              {broadcast && (
                <Button size='xs' color='orange' onClick={handleRetry} disabled={isGenerating}>
                  リトライ
                </Button>
              )}
            </Stack>
          ) : null}

          <Stack gap='sm' flex={1}>
            {displayMessages.map((message) => (
              <Stack key={message.id ?? `${message.role}-${definition.id}`}>
                <Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
                  {collectText(message.parts)}
                </Text>
                <Divider />
              </Stack>
            ))}
            {isWaitingForText && (
              <Stack gap='xs'>
                <Skeleton height={14} radius='sm' />
                <Skeleton height={14} radius='sm' width='85%' />
                <Skeleton height={14} radius='sm' width='70%' />
              </Stack>
            )}
          </Stack>

          {status === '応答済み' && (
            <Stack gap='xs' pb={'lg'}>
              <Textarea
                autosize
                minRows={1}
                maxRows={4}
                placeholder={`${definition.label}に追加質問する`}
                value={followUpInput}
                onChange={setFollowUpInput}
              />
              <Group justify='flex-end'>
                <Button
                  size='sm'
                  variant='light'
                  disabled={followUpInput.length === 0 || isGenerating}
                  onClick={handleFollowUpSend}
                >
                  個別に送信
                </Button>
              </Group>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Carousel.Slide>
  );
});
ModelSlide.displayName = 'ModelSlide';
