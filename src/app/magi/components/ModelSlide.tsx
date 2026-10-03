'use client';

import { useChat } from '@ai-sdk/react';
import { Carousel } from '@mantine/carousel';
import { Badge, Button, Divider, Group, Paper, Skeleton, Stack, Text, Textarea } from '@mantine/core';
import { useInputState } from '@mantine/hooks';
import { type ChatOnFinishCallback, DefaultChatTransport, type UIMessage } from 'ai';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { ImageAttachment } from '@/app/magi/type';
import type { ModelDefinition, ModelKey } from '@/app/magi/util';

// broadcastのたびにidをインクリメントし、同じ質問文でも再送信できるようにする
// synthesizeがfalse（統合済みの状態での追加の一括質問）の場合は、完了しても親へ通知せず意見統合を走らせない
export type BroadcastPayload = { text: string; images: ImageAttachment[]; id: number; synthesize: boolean } | null;

// テキストと画像添付を合わせてsendMessage用のpartsに変換する
const buildMessageParts = (text: string, images: ImageAttachment[]) => [
  { type: 'text' as const, text },
  ...images.map((image) => ({ type: 'file' as const, mediaType: image.mediaType, url: image.dataUrl }))
];

type ModelStatus = '待機中' | '生成中' | '応答済み' | 'エラー';

const STATUS_COLORS: Record<ModelStatus, string> = {
  待機中: 'gray',
  生成中: 'blue',
  応答済み: 'teal',
  エラー: 'red'
};

const useModelChat = (modelId: ModelKey, recon: string | undefined, onFinish: ChatOnFinishCallback<UIMessage>) => {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/magi/chat',
        body: { modelId, recon }
      }),
    [modelId, recon]
  );

  return useChat({
    id: `magi-${modelId}`,
    transport,
    onFinish
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

// 文字列を連結せずにテキストが到着済みかどうかだけを判定する
const hasTextPart = (parts: Array<{ type: string; text?: string }>) =>
  parts.some((part) => part.type === 'text' && typeof part.text === 'string' && part.text.length > 0);

type MessageTextProps = {
  parts: Array<{ type: string; text?: string }>;
};

// メッセージ単位でmemo化し、ストリーミング中に確定済みメッセージが再連結されないようにする
const MessageText = memo(({ parts }: MessageTextProps) => (
  <Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
    {collectText(parts)}
  </Text>
));
MessageText.displayName = 'MessageText';

export type ModelSlideProps = {
  definition: ModelDefinition;
  broadcast: BroadcastPayload;
  // 親でリセットされるたびにインクリメントされる。変化したら会話履歴を消去する
  resetId: number;
  recon: string | undefined;
  onCompleted: (modelId: ModelKey, response: string) => void;
  // 生成中かどうかが変わったら親へ通知する（親の操作ボタンの無効化に使う）
  onGeneratingChange: (modelId: ModelKey, isGenerating: boolean) => void;
};

export const ModelSlide = memo(
  ({ definition, broadcast, resetId, recon, onCompleted, onGeneratingChange }: ModelSlideProps) => {
    const [followUpInput, setFollowUpInput] = useInputState('');
    // 停止ボタンで中断したかどうか。停止はエラー扱いとし、リトライで再生成できるようにする
    const [isStopped, setIsStopped] = useState(false);
    // 正常終了したがテキストが空だったかどうか（安全フィルタや推論のみの応答など）。エラー扱いとし、リトライできるようにする
    const [isEmptyResponse, setIsEmptyResponse] = useState(false);
    const lastProcessedBroadcastId = useRef<number>(-1);
    // 現在のリクエストが意見統合の対象（リセット後最初の一括質問、またはそのリトライ）かどうか
    // 個別チャット・追加の一括質問では false にし、完了しても親へ通知しない
    const notifyOnFinishRef = useRef(false);

    // 完了通知は正常終了時のみ行う。エラー・停止ボタンによる中断・切断や空応答は成功として扱わない
    const chat = useModelChat(definition.id, recon, ({ message, isAbort, isDisconnect, isError }) => {
      if (isAbort || isDisconnect || isError) return;
      const response = collectText(message.parts);
      if (response.length === 0) {
        setIsEmptyResponse(true);
        return;
      }
      if (!notifyOnFinishRef.current) return;
      notifyOnFinishRef.current = false;
      onCompleted(definition.id, response);
    });
    const lastProcessedResetId = useRef(resetId);

    // broadcastが変化したらメッセージを送信
    useEffect(() => {
      if (broadcast && broadcast.id !== lastProcessedBroadcastId.current) {
        lastProcessedBroadcastId.current = broadcast.id;
        notifyOnFinishRef.current = broadcast.synthesize;
        setIsStopped(false);
        setIsEmptyResponse(false);
        void chat.sendMessage({ parts: buildMessageParts(broadcast.text, broadcast.images) });
      }
    }, [broadcast, chat.sendMessage]);

    // リセット時は生成中のストリームを止めてから会話履歴を消去
    // setFollowUpInputは毎レンダー再生成されるため、処理済みのresetIdを記録して1回だけ実行する
    useEffect(() => {
      if (resetId === lastProcessedResetId.current) return;
      lastProcessedResetId.current = resetId;
      notifyOnFinishRef.current = false;
      void chat.stop();
      chat.setMessages([]);
      chat.clearError();
      setIsStopped(false);
      setIsEmptyResponse(false);
      setFollowUpInput('');
    }, [resetId, chat.stop, chat.setMessages, chat.clearError, setFollowUpInput]);

    const hasAssistantReply = chat.messages.some((message) => message.role === 'assistant');
    const isGenerating = chat.status === 'streaming' || chat.status === 'submitted';
    const hasError = !!chat.error || isStopped || isEmptyResponse;
    const getErrorMessage = () => {
      if (chat.error) return chat.error.message;
      if (isEmptyResponse) return '空の応答でした';
      return '停止しました';
    };
    const status = getModelStatus(chat.status, hasAssistantReply, hasError);
    const visibleMessages = chat.messages.filter((message) => message.role !== 'system');
    const displayMessages = visibleMessages.filter((_, i) => !(i === 0 && visibleMessages[0]?.role === 'user'));
    const lastMessage = chat.messages[chat.messages.length - 1];
    const isWaitingForText = isGenerating && (lastMessage?.role !== 'assistant' || !hasTextPart(lastMessage.parts));

    // 生成中かどうかを親へ通知する
    useEffect(() => {
      onGeneratingChange(definition.id, isGenerating);
    }, [definition.id, isGenerating, onGeneratingChange]);

    const handleStop = () => {
      setIsStopped(true);
      void chat.stop();
    };

    // 失敗・停止したリクエストだけを再生成する。会話履歴と意見統合の対象かどうかはそのまま引き継ぐ
    const handleRetry = () => {
      setIsStopped(false);
      setIsEmptyResponse(false);
      void chat.regenerate();
    };

    const handleFollowUpSend = () => {
      if (!followUpInput) return;
      const text = followUpInput;
      setFollowUpInput('');
      notifyOnFinishRef.current = false;
      setIsEmptyResponse(false);
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
              <Button size='xs' color='red' onClick={handleStop} disabled={!isGenerating}>
                停止
              </Button>
            </Group>

            {hasError && !isGenerating ? (
              <Stack gap='xs'>
                <Text size='sm' c='red'>
                  エラー: {getErrorMessage()}
                </Text>
                {chat.messages.length > 0 && (
                  <Button size='xs' color='orange' onClick={handleRetry}>
                    リトライ
                  </Button>
                )}
              </Stack>
            ) : null}

            <Stack gap='sm' flex={1}>
              {displayMessages.map((message) => (
                <Stack key={message.id ?? `${message.role}-${definition.id}`}>
                  <MessageText parts={message.parts} />
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
  }
);
ModelSlide.displayName = 'ModelSlide';
