'use client';

import { useChat } from '@ai-sdk/react';
import { Box, Button, Group, Stack, Textarea, TextInput } from '@mantine/core';
import { useInputState } from '@mantine/hooks';
import { DefaultChatTransport } from 'ai';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { MessageInput, Messages } from './Chat';

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useInputState('');
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const [messageInputValue, setMessageInputValue] = useInputState('動画のタイトルの質問に対する解答を教えて下さい。');

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/youtube/chat'
      }),
    []
  );

  const { messages, sendMessage, status, stop } = useChat({ transport });

  const isResponding = status === 'streaming' || status === 'submitted';

  const handleFetchTranscript = async () => {
    setIsFetchingTranscript(true);
    try {
      const response = await fetch('/api/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl })
      });
      const data = await response.json();

      if (data.status === 'ok') {
        setTitle(data.title);
        setTranscript(data.transcribed);
      } else {
        setTranscript('字幕の取得に失敗しました');
      }
    } finally {
      setIsFetchingTranscript(false);
    }
  };

  const handleSubmit = (input: string) => {
    sendMessage({ parts: [{ type: 'text', text: input }] }, { body: { transcript, title } });
  };

  const handleButtonClick = (text: string) => {
    setMessageInputValue(text);
  };

  return (
    <Stack gap='sm'>
      <Suspense fallback={<div>Loading...</div>}>
        <SearchParamsComponent setYoutubeUrl={setYoutubeUrl} youtubeUrl={youtubeUrl} />
      </Suspense>
      <TextInput
        label='YoutubeのURLを入力して取得ボタンを押してください'
        placeholder='https://www.youtube.com/watch?v=xaY01JIAcCI'
        value={youtubeUrl}
        onChange={setYoutubeUrl}
        inputContainer={(children) => (
          <Group align='flex-start' gap='0' w='100%'>
            <Box flex={1}>{children}</Box>
            <Button onClick={handleFetchTranscript} loading={isFetchingTranscript}>
              取得
            </Button>
          </Group>
        )}
      />
      <Textarea label='動画の字幕' readOnly minRows={5} value={transcript} />
      <MessageInput
        onSendMessage={handleSubmit}
        onStop={stop}
        isResponding={isResponding}
        value={messageInputValue}
        onChange={(event) => setMessageInputValue(event)}
      />
      <Group gap={'xs'}>
        <Button
          variant='light'
          onClick={() => handleButtonClick('動画の核となる内容を数値は省略せず箇条書きで10つで要約してください。')}
        >
          要約
        </Button>
        <Button variant='light' onClick={() => handleButtonClick('動画のタイトルの質問に対する解答を教えて下さい。')}>
          結論
        </Button>
      </Group>
      <Messages messages={messages} />
    </Stack>
  );
}

function SearchParamsComponent({
  setYoutubeUrl,
  youtubeUrl
}: {
  setYoutubeUrl: (value: string) => void;
  youtubeUrl: string;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = searchParams.get('url');
    if (url && youtubeUrl === '') {
      setYoutubeUrl(url);
    }
  }, [searchParams, setYoutubeUrl, youtubeUrl]);

  return null;
}
