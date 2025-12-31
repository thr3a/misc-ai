'use client';

import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import {
  type IssueSchema,
  MODEL_DEFINITIONS,
  MODEL_DEFINITION_MAP,
  type ModelKey,
  factCheckSchema
} from '@/app/magi/util';
import { type Experimental_UseObjectHelpers, useChat, experimental_useObject as useObject } from '@ai-sdk/react';
import { Carousel } from '@mantine/carousel';
import { Badge, Box, Button, Group, Paper, Stack, Text, Textarea } from '@mantine/core';
import { useDisclosure, useInputState, useListState } from '@mantine/hooks';
import { DefaultChatTransport } from 'ai';
import { type CSSProperties, useMemo, useState } from 'react';
import type { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type ModelStatus = '待機中' | '生成中' | '応答済み';

type FactCheckEntryStatus = 'idle' | 'loading' | 'success' | 'error';

type FactCheckPayload = {
  modelId: ModelKey;
  targetModel: ModelKey;
  targetAnswer: string;
};

type FactCheckResult = z.infer<typeof factCheckSchema>;
type FactCheckIssue = z.infer<typeof IssueSchema>;
type FactCheckIssuePartial = Partial<FactCheckIssue>;
type FactCheckStream = Experimental_UseObjectHelpers<FactCheckResult, FactCheckPayload>;

type FactCheckEntry = {
  id: string;
  targetId: ModelKey;
  reviewerId: ModelKey;
  status: FactCheckEntryStatus;
  issues: FactCheckIssuePartial[];
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

const MULTILINE_TEXT_STYLE: CSSProperties = { whiteSpace: 'pre-wrap' };

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

const useFactCheckStream = (modelId: ModelKey): FactCheckStream =>
  useObject<typeof factCheckSchema, FactCheckResult, FactCheckPayload>({
    id: `magi-fact-check-${modelId}`,
    api: '/api/magi/fact-check',
    schema: factCheckSchema
  });

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
    .join('\n');

const getLatestAssistantText = (messages: ModelChatInstance['messages']) => {
  const assistantMessages = messages.filter((message) => message.role === 'assistant');
  if (assistantMessages.length === 0) {
    return '';
  }
  const latest = assistantMessages[assistantMessages.length - 1];
  return collectText(latest.parts);
};

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
  const [question, setQuestion] = useInputState('今後LABUBU（ラブブ）の人気はハローキティを超えると思いますか？');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [factCheckVisible, { open: openFactCheck, close: closeFactCheck }] = useDisclosure(false);
  const [followUpInputs, followUpHandlers] = useListState<string>(MODEL_DEFINITIONS.map(() => ''));
  const [factCheckManualErrors, setFactCheckManualErrors] = useState<Partial<Record<ModelKey, string>>>({});

  const chatMap: Record<ModelKey, ModelChatInstance> = {
    gemini: useModelChat('gemini'),
    gpt5: useModelChat('gpt5'),
    claude: useModelChat('claude')
  };
  const factCheckStreams: Record<ModelKey, FactCheckStream> = {
    gemini: useFactCheckStream('gemini'),
    gpt5: useFactCheckStream('gpt5'),
    claude: useFactCheckStream('claude')
  };

  const modelSections = MODEL_DEFINITIONS.map((definition) => ({
    definition,
    chat: chatMap[definition.id]
  }));
  const factCheckEntries: FactCheckEntry[] = MODEL_DEFINITIONS.map((definition) => {
    const stream = factCheckStreams[definition.id];
    const manualError = factCheckManualErrors[definition.id];
    const issues = (stream.object?.issues ?? []) as FactCheckIssuePartial[];

    let status: FactCheckEntryStatus = 'idle';
    let errorMessage = manualError;

    if (manualError) {
      status = 'error';
    } else if (stream.isLoading) {
      status = 'loading';
    } else if (stream.error) {
      status = 'error';
      errorMessage = stream.error.message;
    } else if (issues.length > 0) {
      status = 'success';
    }

    return {
      id: `${definition.reviewer}-${definition.id}`,
      reviewerId: definition.reviewer,
      targetId: definition.id,
      status,
      issues,
      error: errorMessage
    };
  });
  const factCheckLoading = factCheckEntries.some((entry) => entry.status === 'loading');
  const isQuestionEmpty = question.length === 0;

  const handleBroadcast = () => {
    setEnhanceError(null);
    setQuestion('');
    for (const { chat } of modelSections) {
      void chat.sendMessage({
        parts: [{ type: 'text', text: question }]
      });
    }
  };

  const handleEnhancePrompt = async () => {
    setEnhanceError(null);
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/magi/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: question })
      });
      const payload = (await response.json().catch(() => null)) as { enhancedPrompt?: string; error?: string } | null;
      if (!response.ok || !payload) {
        throw new Error(payload?.error ?? '強化リクエストに失敗しました。');
      }
      if (payload.enhancedPrompt) {
        setQuestion(payload.enhancedPrompt);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '強化リクエストに失敗しました。';
      setEnhanceError(message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleFollowUpChange = (index: number, value: string) => {
    followUpHandlers.setItem(index, value);
  };

  const handleFollowUpSend = (index: number, modelId: ModelKey) => {
    const text = followUpInputs[index];
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

  const resetFactChecks = () => {
    setFactCheckManualErrors({});
    for (const stream of Object.values(factCheckStreams)) {
      stream.clear();
    }
  };

  const runFactChecks = () => {
    setFactCheckManualErrors({});
    for (const { definition, chat } of modelSections) {
      const latestAnswer = getLatestAssistantText(chat.messages);
      if (!latestAnswer) {
        factCheckStreams[definition.id].clear();
        setFactCheckManualErrors((prev) => ({
          ...prev,
          [definition.id]: '回答がまだありません。'
        }));
        continue;
      }
      factCheckStreams[definition.id].stop();
      void factCheckStreams[definition.id].submit({
        modelId: definition.reviewer,
        targetModel: definition.id,
        targetAnswer: latestAnswer
      });
    }
  };

  const handleFactCheckClick = () => {
    if (factCheckVisible) {
      closeFactCheck();
      resetFactChecks();
      return;
    }
    openFactCheck();
    runFactChecks();
  };

  return (
    <Box mx='auto'>
      <Stack gap='md'>
        <Stack gap='xs'>
          <Textarea
            label={'質問内容'}
            value={question}
            onChange={(event) => {
              setEnhanceError(null);
              setQuestion(event);
            }}
            autosize
            minRows={5}
            maxRows={10}
          />
          <Group justify='center' align='center'>
            <Button size='sm' disabled={isQuestionEmpty} onClick={handleBroadcast}>
              送信
            </Button>
            <Button
              size='sm'
              variant='light'
              loading={isEnhancing}
              disabled={isQuestionEmpty}
              onClick={handleEnhancePrompt}
            >
              強化
            </Button>
            <ButtonCopy content={question} disabled={isQuestionEmpty} />
          </Group>
          {enhanceError ? (
            <Text size='xs' c='red' ta='center'>
              {enhanceError}
            </Text>
          ) : null}
        </Stack>

        <Carousel
          slideGap='md'
          slideSize={{ base: '100%', sm: '50%', lg: '33.333333%' }}
          withIndicators
          emblaOptions={{ align: 'start' }}
        >
          {modelSections.map(({ definition, chat }, index) => {
            const hasAssistantReply = chat.messages.some((message) => message.role === 'assistant');
            const status = getModelStatus(chat.status, hasAssistantReply);
            const visibleMessages = chat.messages.filter((message) => message.role !== 'system');
            const firstUserMessageIndex = visibleMessages.findIndex((message) => message.role === 'user');
            const displayMessages =
              firstUserMessageIndex === -1
                ? visibleMessages
                : visibleMessages.filter((_, messageIndex) => messageIndex !== firstUserMessageIndex);

            return (
              <Carousel.Slide key={definition.id}>
                <Paper withBorder p='sm' h='100%'>
                  <Stack gap='sm' h='100%'>
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

                    <Stack gap='sm' flex={1}>
                      {displayMessages.length !== 0 &&
                        displayMessages.map((message) => (
                          <Stack gap={2} key={message.id ?? `${message.role}-${definition.id}`}>
                            <Text size='xs' c='dimmed'>
                              {message.role === 'user' ? '自分' : definition.label}
                            </Text>
                            <Text size='sm' style={MULTILINE_TEXT_STYLE}>
                              {collectText(message.parts)}
                            </Text>
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
                        placeholder={`${definition.label}に追加質問する`}
                        value={followUpInputs[index]}
                        onChange={(event) => handleFollowUpChange(index, event.currentTarget.value)}
                      />
                      <Group justify='flex-end'>
                        <Button
                          size='sm'
                          variant='light'
                          disabled={followUpInputs[index].length === 0}
                          onClick={() => handleFollowUpSend(index, definition.id)}
                        >
                          個別に送信
                        </Button>
                      </Group>
                    </Stack>
                  </Stack>
                </Paper>
              </Carousel.Slide>
            );
          })}
        </Carousel>

        <Paper withBorder p='sm'>
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
                      {entry.status === 'success' ? (
                        entry.issues.length > 0 ? (
                          <Stack gap='sm'>
                            {entry.issues.map((issue, issueIndex) => (
                              <Stack key={`${entry.id}-${issueIndex}`} gap={4}>
                                <Text size='xs' c='dimmed'>
                                  指摘{issueIndex + 1}
                                </Text>
                                <Stack gap={2}>
                                  <Text size='xs' c='dimmed'>
                                    誤っている記述
                                  </Text>
                                  <Text size='sm' style={MULTILINE_TEXT_STYLE}>
                                    {issue.description ?? '生成中...'}
                                  </Text>
                                </Stack>
                                <Stack gap={2}>
                                  <Text size='xs' c='dimmed'>
                                    訂正内容
                                  </Text>
                                  <Text size='sm' style={MULTILINE_TEXT_STYLE}>
                                    {issue.correction ?? '生成中...'}
                                  </Text>
                                </Stack>
                              </Stack>
                            ))}
                          </Stack>
                        ) : (
                          <Text size='sm' style={MULTILINE_TEXT_STYLE}>
                            指摘事項は見つかりませんでした。
                          </Text>
                        )
                      ) : entry.status === 'error' ? (
                        <Text size='sm' c='red' style={MULTILINE_TEXT_STYLE}>
                          {entry.error ?? 'レビューに失敗しました。'}
                        </Text>
                      ) : (
                        <Text size='sm' c='dimmed'>
                          レビューを実行しています...
                        </Text>
                      )}
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
