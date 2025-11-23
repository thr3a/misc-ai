'use client';

import { MODEL_DEFINITIONS, MODEL_DEFINITION_MAP, type ModelDefinition, type ModelKey } from '@/app/magi/util';
import { useChat } from '@ai-sdk/react';
import { Badge, Box, Button, Divider, Group, Paper, Stack, Text, Textarea } from '@mantine/core';
import { useDisclosure, useInputState, useListState } from '@mantine/hooks';
import { DefaultChatTransport } from 'ai';
import { useMemo, useState } from 'react';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type ModelStatus = '待機中' | '生成中' | '応答済み';

type FactCheckEntryStatus = 'idle' | 'loading' | 'success' | 'error';

type FactCheckEntry = {
  id: string;
  targetId: ModelKey;
  reviewerId: ModelKey;
  status: FactCheckEntryStatus;
  content: string;
  error?: string;
};

type TextPart = {
  type: 'text';
  text: string;
};

type ModelChatInstance = ReturnType<typeof useModelChat>;

const STATUS_COLORS: Record<ModelStatus, string> = {
  待機中: 'gray',
  生成中: 'blue',
  応答済み: 'teal'
};

const FACT_CHECK_STATUS_LABEL: Record<FactCheckEntryStatus, string> = {
  idle: '待機中',
  loading: '検証中',
  success: '完了',
  error: '失敗'
};

const FACT_CHECK_STATUS_COLOR: Record<FactCheckEntryStatus, string> = {
  idle: 'gray',
  loading: 'blue',
  success: 'teal',
  error: 'red'
};

const INITIAL_QUESTION = '今後LABUBU（ラブブ）の人気はどうなると思う？';

const useModelChat = (modelId: ModelKey) => {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/magi/chat',
        body: {
          modelId
        }
      }),
    [modelId]
  );

  return useChat({
    id: `magi-${modelId}`,
    transport
  });
};

const getModelStatus = (status: ModelChatInstance['status'], hasAssistantReply: boolean): ModelStatus => {
  if (status === 'submitted' || status === 'streaming') {
    return '生成中';
  }
  if (hasAssistantReply) {
    return '応答済み';
  }
  return '待機中';
};

const collectText = (parts: Array<TextPart | { type: string }>) =>
  parts
    .filter((part): part is TextPart => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();

const getLatestAssistantText = (messages: ModelChatInstance['messages']) => {
  const assistantMessages = messages.filter((message) => message.role === 'assistant');
  if (assistantMessages.length === 0) {
    return '';
  }
  const latest = assistantMessages[assistantMessages.length - 1];
  return collectText(latest.parts);
};

const createInitialFactChecks = (): FactCheckEntry[] =>
  MODEL_DEFINITIONS.map(
    (definition): FactCheckEntry => ({
      id: `${definition.reviewer}-${definition.id}`,
      reviewerId: definition.reviewer,
      targetId: definition.id,
      status: 'idle',
      content: ''
    })
  );

const FactCheckDescription = () => (
  <Text size='xs' c='dimmed'>
    Geminiの回答はGPT5が、GPT5はClaudeが、ClaudeはGeminiが検証します。
  </Text>
);

const FactCheckEmptyState = () => (
  <Text size='xs' c='dimmed'>
    ボタンを押すと各AIが直前の回答をレビューし、正確性と妥当性をコメントします。
  </Text>
);

// 関数名は変えないこと
export default function Page() {
  const [question, setQuestion] = useInputState(INITIAL_QUESTION);
  const [factCheckVisible, { open: openFactCheck, close: closeFactCheck }] = useDisclosure(false);
  const [followUpInputs, followUpHandlers] = useListState<string>(MODEL_DEFINITIONS.map(() => ''));
  const [factCheckEntries, setFactCheckEntries] = useState<FactCheckEntry[]>(createInitialFactChecks);
  const [factCheckLoading, setFactCheckLoading] = useState(false);

  const chatMap: Record<ModelKey, ModelChatInstance> = {
    gemini: useModelChat('gemini'),
    gpt5: useModelChat('gpt5'),
    claude: useModelChat('claude')
  };

  const modelSections = MODEL_DEFINITIONS.map((definition) => ({
    definition,
    chat: chatMap[definition.id]
  }));

  const handleBroadcast = () => {
    const trimmed = question.trim();
    if (!trimmed) {
      return;
    }
    setQuestion('');
    for (const { chat } of modelSections) {
      void chat.sendMessage({
        parts: [{ type: 'text', text: trimmed }]
      });
    }
  };

  const handleFollowUpChange = (index: number, value: string) => {
    followUpHandlers.setItem(index, value);
  };

  const handleFollowUpSend = (index: number, modelId: ModelKey) => {
    const text = followUpInputs[index].trim();
    if (!text) {
      return;
    }
    followUpHandlers.setItem(index, '');
    const section = modelSections.find((item) => item.definition.id === modelId);
    if (!section) {
      return;
    }
    void section.chat.sendMessage({
      parts: [{ type: 'text', text }]
    });
  };

  const resetFactChecks = () =>
    setFactCheckEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        status: 'idle',
        content: '',
        error: undefined
      }))
    );

  const runFactChecks = async () => {
    setFactCheckLoading(true);
    setFactCheckEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        status: 'loading',
        content: '',
        error: undefined
      }))
    );

    await Promise.all(
      modelSections.map(async ({ definition, chat }) => {
        const latestAnswer = getLatestAssistantText(chat.messages);
        if (!latestAnswer) {
          setFactCheckEntries((prev) =>
            prev.map((entry) =>
              entry.targetId === definition.id ? { ...entry, status: 'error', error: '回答がまだありません。' } : entry
            )
          );
          return;
        }

        try {
          const response = await fetch('/api/magi/fact-check', {
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              modelId: definition.reviewer,
              targetModel: definition.id,
              targetAnswer: latestAnswer
            })
          });
          const payload = (await response.json()) as { content?: string; error?: string };
          if (!response.ok || payload.error) {
            throw new Error(payload.error ?? 'レビュアーが結果を返しませんでした。');
          }
          setFactCheckEntries((prev) =>
            prev.map((entry) =>
              entry.targetId === definition.id
                ? { ...entry, status: 'success', content: payload.content ?? 'レビュー結果が空です。' }
                : entry
            )
          );
        } catch (error) {
          setFactCheckEntries((prev) =>
            prev.map((entry) =>
              entry.targetId === definition.id
                ? {
                    ...entry,
                    status: 'error',
                    error: error instanceof Error ? error.message : '不明なエラーが発生しました。'
                  }
                : entry
            )
          );
        }
      })
    );

    setFactCheckLoading(false);
  };

  const handleFactCheckClick = () => {
    if (factCheckVisible) {
      closeFactCheck();
      resetFactChecks();
      return;
    }
    openFactCheck();
    void runFactChecks();
  };

  return (
    <Box mx='auto' maw={480} px='xs' py='xs'>
      <Stack gap='lg'>
        <Paper withBorder p='md'>
          <Stack gap='sm'>
            <Textarea value={question} onChange={setQuestion} autosize minRows={3} maxRows={6} />
            <Group justify='center' align='center'>
              <Button size='sm' disabled={question.trim().length === 0} onClick={handleBroadcast}>
                一括リクエスト
              </Button>
            </Group>
          </Stack>
        </Paper>

        <Stack gap='md'>
          {modelSections.map(({ definition, chat }, index) => {
            const hasAssistantReply = chat.messages.some((message) => message.role === 'assistant');
            const status = getModelStatus(chat.status, hasAssistantReply);
            const latestAnswer = getLatestAssistantText(chat.messages);
            const visibleMessages = chat.messages.filter((message) => message.role !== 'system');
            const firstUserMessageIndex = visibleMessages.findIndex((message) => message.role === 'user');
            const displayMessages =
              firstUserMessageIndex === -1
                ? visibleMessages
                : visibleMessages.filter((_, messageIndex) => messageIndex !== firstUserMessageIndex);

            return (
              <Paper key={definition.id} withBorder p='md'>
                <Stack gap='sm'>
                  <Group justify='space-between' align='flex-start'>
                    <Stack gap={2}>
                      <Group gap='xs'>
                        <Text fw={600}>{definition.label}</Text>
                        <Badge variant='light' color={STATUS_COLORS[status]}>
                          {status}
                        </Badge>
                      </Group>
                    </Stack>
                    <Button
                      size='xs'
                      variant='subtle'
                      onClick={() => chat.stop()}
                      disabled={chat.status !== 'streaming' && chat.status !== 'submitted'}
                    >
                      停止
                    </Button>
                  </Group>

                  {chat.error ? (
                    <Text size='sm' c='red'>
                      エラー: {chat.error.message}
                    </Text>
                  ) : null}

                  <Stack gap='sm'>
                    {displayMessages.length !== 0 &&
                      displayMessages.map((message) => (
                        <Stack gap={2} key={message.id ?? `${message.role}-${definition.id}`}>
                          <Text size='xs' c='dimmed'>
                            {message.role === 'user' ? '自分' : definition.label}
                          </Text>
                          <Text size='sm'>{collectText(message.parts)}</Text>
                        </Stack>
                      ))}
                    {(chat.status === 'streaming' || chat.status === 'submitted') && (
                      <Text size='xs' c='dimmed'>
                        生成中...
                      </Text>
                    )}
                  </Stack>

                  <Stack gap='xs'>
                    <Textarea
                      autosize
                      minRows={1}
                      maxRows={4}
                      placeholder={`${definition.label}に追撃の質問を書く`}
                      value={followUpInputs[index]}
                      onChange={(event) => handleFollowUpChange(index, event.currentTarget.value)}
                    />
                    <Group justify='flex-end'>
                      <Button
                        size='sm'
                        variant='light'
                        disabled={followUpInputs[index].trim().length === 0}
                        onClick={() => handleFollowUpSend(index, definition.id)}
                      >
                        個別に送信
                      </Button>
                    </Group>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        <Paper withBorder p='md'>
          <Stack gap='sm'>
            <Stack gap='xs'>
              <Stack gap={2}>
                <Text size='sm' fw={600}>
                  ファクトチェック
                </Text>
                <FactCheckDescription />
              </Stack>
              <Group justify='center'>
                <Button size='sm' variant='outline' onClick={handleFactCheckClick} loading={factCheckLoading}>
                  {factCheckVisible ? '結果を閉じる' : 'チェック実行'}
                </Button>
              </Group>
            </Stack>

            {factCheckVisible ? (
              <Stack gap='sm'>
                {factCheckEntries.map((entry) => {
                  const reviewerLabel = MODEL_DEFINITION_MAP[entry.reviewerId].label;
                  const targetLabel = MODEL_DEFINITION_MAP[entry.targetId].label;
                  return (
                    <Stack
                      key={entry.id}
                      gap={6}
                      p='sm'
                      style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}
                    >
                      <Group justify='space-between'>
                        <Text size='sm' fw={500}>
                          {reviewerLabel} → {targetLabel}
                        </Text>
                        <Badge size='xs' color={FACT_CHECK_STATUS_COLOR[entry.status]} variant='light'>
                          {FACT_CHECK_STATUS_LABEL[entry.status]}
                        </Badge>
                      </Group>
                      <Text size='sm' c={entry.status === 'error' ? 'red' : undefined}>
                        {entry.status === 'success'
                          ? entry.content
                          : entry.status === 'error'
                            ? (entry.error ?? 'レビューに失敗しました。')
                            : 'レビューを実行しています...'}
                      </Text>
                    </Stack>
                  );
                })}
              </Stack>
            ) : (
              <FactCheckEmptyState />
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
