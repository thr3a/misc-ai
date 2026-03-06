'use client';

import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import { synthesizeResultSchema } from '@/app/magi/type';
import { MODEL_DEFINITIONS, type ModelDefinition, type ModelKey } from '@/app/magi/util';
import { useChat, experimental_useObject as useObject } from '@ai-sdk/react';
import { Carousel } from '@mantine/carousel';
import {
  Badge,
  Box,
  Button,
  Divider,
  Group,
  List,
  Paper,
  Skeleton,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title
} from '@mantine/core';
import { useInputState } from '@mantine/hooks';
import { IconDownload } from '@tabler/icons-react';
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { DefaultChatTransport } from 'ai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ModelStatus = '待機中' | '生成中' | '応答済み';

type ModelChatInstance = ReturnType<typeof useModelChat>;

const STATUS_COLORS: Record<ModelStatus, string> = {
  待機中: 'dark.8',
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

const collectText = (parts: Array<{ type: string; text?: string }>) =>
  parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text' && 'text' in part)
    .map((part) => part.text)
    .join('\n');

// broadcastのたびにidをインクリメントし、同じ質問文でも再送信できるようにする
type BroadcastPayload = { text: string; id: number } | null;

type ModelSlideProps = {
  definition: ModelDefinition;
  broadcast: BroadcastPayload;
  onCompleted: (modelId: ModelKey, response: string) => void;
};

const ModelSlide = memo(({ definition, broadcast, onCompleted }: ModelSlideProps) => {
  const chat = useModelChat(definition.id);
  const [followUpInput, setFollowUpInput] = useInputState('');
  const lastProcessedBroadcastId = useRef<number>(-1);
  const completionNotifiedRef = useRef(false);

  // broadcastが変化したらメッセージを送信
  useEffect(() => {
    if (broadcast && broadcast.id !== lastProcessedBroadcastId.current) {
      lastProcessedBroadcastId.current = broadcast.id;
      void chat.sendMessage({ parts: [{ type: 'text', text: broadcast.text }] });
    }
  }, [broadcast, chat.sendMessage]);

  const hasAssistantReply = chat.messages.some((message) => message.role === 'assistant');
  const isGenerating = chat.status === 'streaming' || chat.status === 'submitted';
  const status = getModelStatus(chat.status, hasAssistantReply);
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
            <Text size='sm' c='red'>
              エラー: {chat.error.message}
            </Text>
          ) : null}

          <Stack gap='sm' flex={1}>
            {isWaitingForText ? (
              <Stack gap='xs'>
                <Skeleton height={14} radius='sm' />
                <Skeleton height={14} radius='sm' width='85%' />
                <Skeleton height={14} radius='sm' width='70%' />
              </Stack>
            ) : (
              displayMessages.length !== 0 &&
              displayMessages.map((message) => (
                <Stack key={message.id ?? `${message.role}-${definition.id}`}>
                  <Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
                    {collectText(message.parts)}
                  </Text>
                  <Divider />
                </Stack>
              ))
            )}
          </Stack>

          {hasAssistantReply && (
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

// 関数名は変えないこと
export default function Page() {
  const [question, setQuestion] = useInputState('スプラトゥーンが流行った理由は？');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [broadcast, setBroadcast] = useState<BroadcastPayload>(null);
  const [completedResponses, setCompletedResponses] = useState<Partial<Record<ModelKey, string>>>({});
  const autoSynthesizeTriggered = useRef(false);

  const {
    object: synthesizeObject,
    submit: submitSynthesize,
    isLoading: isSynthesizing,
    error: synthesizeError
  } = useObject({
    api: '/api/magi/synthesize',
    schema: synthesizeResultSchema
  });

  const isQuestionEmpty = question.length === 0;

  const allModelsCompleted = useMemo(
    () => MODEL_DEFINITIONS.every((d) => completedResponses[d.id] !== undefined),
    [completedResponses]
  );

  const handleBroadcast = () => {
    setErrorMessage(null);
    autoSynthesizeTriggered.current = false;
    setCompletedResponses({});
    setBroadcast((prev) => ({ text: question, id: (prev?.id ?? 0) + 1 }));
  };

  const handleEnhancePrompt = async () => {
    setErrorMessage(null);
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
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleOnCompleted = useCallback((modelId: ModelKey, response: string) => {
    setCompletedResponses((prev) => ({ ...prev, [modelId]: response }));
  }, []);

  const handleSynthesize = useCallback(
    (responses: Partial<Record<ModelKey, string>>) => {
      setErrorMessage(null);
      const responseList = MODEL_DEFINITIONS.map((d) => responses[d.id] ?? '');
      submitSynthesize({ responses: responseList });
    },
    [submitSynthesize]
  );

  useEffect(() => {
    if (allModelsCompleted && !autoSynthesizeTriggered.current) {
      autoSynthesizeTriggered.current = true;
      handleSynthesize(completedResponses);
    }
  }, [allModelsCompleted, completedResponses, handleSynthesize]);

  const handleExport = () => {
    if (!synthesizeObject) return;

    const lines: string[] = [];

    lines.push(`# 質問\n\n${question}\n`);

    lines.push('## 各モデルの回答\n');
    for (const definition of MODEL_DEFINITIONS) {
      const response = completedResponses[definition.id];
      if (response) {
        lines.push(`### ${definition.label}\n\n${response}\n`);
      }
    }

    lines.push('## 集合知の統合\n');

    if (synthesizeObject.commonOpinions && synthesizeObject.commonOpinions.length > 0) {
      lines.push('### 共通している意見\n');
      for (const opinion of synthesizeObject.commonOpinions) {
        lines.push(`- ${opinion}`);
      }
      lines.push('');
    }

    if (synthesizeObject.conflictingOpinions && synthesizeObject.conflictingOpinions.length > 0) {
      lines.push('### 対立している意見\n');
      for (const opinion of synthesizeObject.conflictingOpinions) {
        lines.push(`- ${opinion}`);
      }
      lines.push('');
    }

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'magi-result.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box mx='auto' mb={'xl'}>
      <Stack gap='md'>
        <Stack gap='xs'>
          <Textarea
            label={'質問内容'}
            value={question}
            onChange={(event) => {
              setErrorMessage(null);
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

          {errorMessage && (
            <Text size='xs' c='red' ta='center'>
              {errorMessage}
            </Text>
          )}
        </Stack>

        <Carousel
          slideGap='md'
          slideSize={{ base: '100%', sm: '50%', lg: '33.333333%' }}
          withIndicators
          withControls={false}
          emblaOptions={{ align: 'start', loop: false }}
          styles={{
            indicator: {
              backgroundColor: 'var(--mantine-color-blue-2)',
              border: '1px solid var(--mantine-color-blue-4)',
              height: '12px',
              '&[dataActive]': {
                backgroundColor: 'var(--mantine-color-blue-8)',
                borderColor: 'var(--mantine-color-blue-9)'
              }
            }
          }}
        >
          {MODEL_DEFINITIONS.map((definition) => (
            <ModelSlide
              key={definition.id}
              definition={definition}
              broadcast={broadcast}
              onCompleted={handleOnCompleted}
            />
          ))}
        </Carousel>

        <Stack gap='xs'>
          {synthesizeError && (
            <Text size='xs' c='red' ta='center'>
              {synthesizeError.message}
            </Text>
          )}
          {isSynthesizing && (
            <Stack gap='sm'>
              <Paper withBorder p='sm'>
                <Stack gap='xs'>
                  <Skeleton height={20} width={150} />
                  <Skeleton height={14} />
                  <Skeleton height={14} width='80%' />
                  <Skeleton height={14} width='65%' />
                </Stack>
              </Paper>
              <Paper withBorder p='sm'>
                <Stack gap='xs'>
                  <Skeleton height={20} width={150} />
                  <Skeleton height={14} />
                  <Skeleton height={14} width='75%' />
                </Stack>
              </Paper>
            </Stack>
          )}
          {synthesizeObject && !isSynthesizing && (
            <Group justify='center'>
              <Button size='sm' variant='light' leftSection={<IconDownload size={16} />} onClick={handleExport}>
                エクスポート
              </Button>
            </Group>
          )}
          {synthesizeObject && (
            <Stack gap='sm'>
              {synthesizeObject.commonOpinions && synthesizeObject.commonOpinions.length > 0 && (
                <Paper withBorder p='sm'>
                  <Stack gap='xs'>
                    <Title order={5} c='teal'>
                      共通している意見
                    </Title>
                    <List
                      spacing='xs'
                      icon={
                        <ThemeIcon color='teal' size={20} radius='xl'>
                          <IconCheck size={12} />
                        </ThemeIcon>
                      }
                    >
                      {synthesizeObject.commonOpinions.map((opinion, i) => (
                        <List.Item key={i}>
                          <Text size='sm'>{opinion}</Text>
                        </List.Item>
                      ))}
                    </List>
                  </Stack>
                </Paper>
              )}
              {synthesizeObject.conflictingOpinions && synthesizeObject.conflictingOpinions.length > 0 && (
                <Paper withBorder p='sm'>
                  <Stack gap='xs'>
                    <Title order={5} c='orange'>
                      対立している意見
                    </Title>
                    <List
                      spacing='xs'
                      icon={
                        <ThemeIcon color='orange' size={20} radius='xl'>
                          <IconAlertTriangle size={12} />
                        </ThemeIcon>
                      }
                    >
                      {synthesizeObject.conflictingOpinions.map((opinion, i) => (
                        <List.Item key={i}>
                          <Text size='sm'>{opinion}</Text>
                        </List.Item>
                      ))}
                    </List>
                  </Stack>
                </Paper>
              )}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
