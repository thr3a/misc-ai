'use client';

import { useChat } from '@ai-sdk/react';
import { Alert, Paper, Stack } from '@mantine/core';
import { usePrevious } from '@mantine/hooks';
import { DefaultChatTransport, type FileUIPart, type UIMessage } from 'ai';
import { useEffect, useMemo, useState } from 'react';
import { ChatHeader, MessageInput, Messages } from './Chat';
import type { SpeechControl, SpeechSettings } from './type';
import { useSpeech } from './useSpeech';
import { defaultSpeechSettings } from './voice';

const collectText = (message: UIMessage) =>
  message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text' && 'text' in part)
    .map((part) => part.text)
    .join('\n');

// 関数名は変えないこと
export default function Page() {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/tts-chat'
      }),
    []
  );

  const { messages, sendMessage, status, stop, error, regenerate, setMessages } = useChat({ transport });
  const [speechSettings, setSpeechSettings] = useState<SpeechSettings>(defaultSpeechSettings);
  const speech = useSpeech(speechSettings);
  const prevStatus = usePrevious(status);

  // 文章の生成が完了したら、最新の返答を自動で読み上げる
  useEffect(() => {
    if (prevStatus !== 'streaming' || status !== 'ready') return;
    const last = messages.at(-1);
    if (last?.role !== 'assistant') return;
    const text = collectText(last);
    if (text.trim() === '') return;
    speech.play(last.id, text);
  }, [prevStatus, status, messages, speech.play]);

  const handleSubmit = (input: string, files: FileUIPart[] = []) => {
    speech.stop();
    // 画像のみ送信時に空のテキストパートを作らないよう、テキストの有無で分岐する
    if (input.trim() === '') {
      sendMessage({ files });
      return;
    }
    sendMessage({ text: input, files });
  };

  const handleReset = () => {
    stop();
    speech.reset();
    setMessages([]);
  };

  const speechControl: SpeechControl = {
    playingId: speech.playingId,
    loadingIds: speech.loadingIds,
    onPlay: speech.play,
    onStop: speech.stop
  };

  return (
    // スマホでは Container の左右余白を打ち消して画面いっぱいに広げ、PC では高さのみ画面いっぱいにする
    <Paper
      shadow='md'
      h='100dvh'
      mx={{ base: 'calc(var(--mantine-spacing-md) * -1)', sm: 0 }}
      bd={{ base: 'none', sm: '1px solid var(--mantine-color-gray-3)' }}
      style={{ overflow: 'hidden' }}
    >
      <Stack gap={0} h='100%'>
        <ChatHeader
          messages={messages}
          status={status}
          onReset={handleReset}
          speechSettings={speechSettings}
          onSpeechSettingsChange={setSpeechSettings}
        />
        <Messages
          messages={messages}
          status={status}
          onRegenerate={() => {
            speech.stop();
            regenerate();
          }}
          onSuggestion={(text) => handleSubmit(text)}
          speech={speechControl}
        />
        {error && (
          <Alert color='red' variant='light' title='エラーが発生しました'>
            {error.message}
          </Alert>
        )}
        {speech.error && (
          <Alert color='orange' variant='light' title='音声の再生に失敗しました'>
            {speech.error}
          </Alert>
        )}
        <MessageInput onSendMessage={handleSubmit} onStop={stop} status={status} />
      </Stack>
    </Paper>
  );
}
