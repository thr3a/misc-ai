'use client';

import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import { MODEL_DEFINITIONS, MODEL_DEFINITION_MAP, type ModelKey } from '@/app/magi/util';
import { useChat } from '@ai-sdk/react';
import { Carousel } from '@mantine/carousel';
import { Badge, Box, Button, Group, Paper, Stack, Text, Textarea } from '@mantine/core';
import { useInputState, useListState } from '@mantine/hooks';
import { DefaultChatTransport } from 'ai';
import { type CSSProperties, useMemo, useState } from 'react';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type ModelStatus = '待機中' | '生成中' | '応答済み';

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
    .join('\n');

// 関数名は変えないこと
export default function Page() {
  const [question, setQuestion] = useInputState('スプラトゥーンが流行った理由は？');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [followUpInputs, followUpHandlers] = useListState<string>(MODEL_DEFINITIONS.map(() => ''));
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizeResult, setSynthesizeResult] = useState('');
  const [synthesizeError, setSynthesizeError] = useState<string | null>(null);

  const chatMap: Record<ModelKey, ModelChatInstance> = {
    gemini: useModelChat('gemini'),
    gpt5: useModelChat('gpt5'),
    claude: useModelChat('claude')
  };

  const modelSections = MODEL_DEFINITIONS.map((definition) => ({
    definition,
    chat: chatMap[definition.id]
  }));

  const isQuestionEmpty = question.length === 0;

  const allModelsCompleted = modelSections.every(({ chat }) => {
    const hasAssistantReply = chat.messages.some((message) => message.role === 'assistant');
    const isNotStreaming = chat.status !== 'streaming' && chat.status !== 'submitted';
    return hasAssistantReply && isNotStreaming;
  });

  const getFirstAssistantResponse = (chat: ModelChatInstance): string => {
    const assistantMessage = chat.messages.find((message) => message.role === 'assistant');
    if (!assistantMessage) {
      return '';
    }
    return collectText(assistantMessage.parts);
  };

  const handleBroadcast = () => {
    setEnhanceError(null);
    // setQuestion('');
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

  const handleSynthesize = async () => {
    setSynthesizeError(null);
    setSynthesizeResult('');
    setIsSynthesizing(true);

    const responses = modelSections.map(({ chat }) => getFirstAssistantResponse(chat));

    try {
      const response = await fetch('/api/magi/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ responses })
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorData?.error ?? '統合リクエストに失敗しました。');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('レスポンスの読み取りに失敗しました。');
      }

      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        setSynthesizeResult(accumulatedText);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '統合リクエストに失敗しました。';
      setSynthesizeError(message);
    } finally {
      setIsSynthesizing(false);
    }
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
                            <Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
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

        <Stack gap='xs'>
          <Group justify='center'>
            <Button size='sm' loading={isSynthesizing} disabled={!allModelsCompleted} onClick={handleSynthesize}>
              集合知を統合
            </Button>
          </Group>
          {synthesizeError && (
            <Text size='xs' c='red' ta='center'>
              {synthesizeError}
            </Text>
          )}
          {synthesizeResult && (
            <Paper withBorder p='sm'>
              <Stack gap='xs'>
                <Group justify='space-between'>
                  <Text fw={600} size='sm'>
                    統合結果
                  </Text>
                  <ButtonCopy content={synthesizeResult} />
                </Group>
                <Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
                  {synthesizeResult}
                </Text>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
