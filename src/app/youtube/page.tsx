'use client';

import { Box, Button, Group, TextInput, Textarea } from '@mantine/core';
import { readStreamableValue } from 'ai/rsc';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { MessageInput, type MessageProps, Messages } from './Chat';
import { continueConversation, fetchTranscript } from './actions';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export default function Home() {
  const [conversation, setConversation] = useState<MessageProps[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const [messageInputValue, setMessageInputValue] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcript, setTranscript] = useState('');

  const handleFetchTranscript = async () => {
    const result = await fetchTranscript(youtubeUrl);
    if (result.status === 'ok') {
      setTranscript(result.title + result.transcribed);
    } else {
      setTranscript('字幕の取得に失敗しました');
    }
  };

  // メッセージが送信されたときの処理
  const handleSubmit = async (input: string): Promise<void> => {
    const updatedConversation: MessageProps[] = [...conversation, { role: 'user', content: input }];
    // ユーザーのメッセージを追加
    setConversation(updatedConversation);
    setIsResponding(true);

    const { messages, newMessage } = await continueConversation(transcript, updatedConversation);

    let textContent = '';
    for await (const delta of readStreamableValue(newMessage)) {
      textContent = `${textContent}${delta}`;
      setConversation([...messages, { role: 'assistant', content: textContent }]);
    }
    setIsResponding(false);
  };

  const handleButtonClick = (text: string) => {
    setMessageInputValue(text);
  };

  return (
    <Box>
      <Suspense fallback={<div>Loading...</div>}>
        <SearchParamsComponent setYoutubeUrl={setYoutubeUrl} youtubeUrl={youtubeUrl} />
      </Suspense>
      <TextInput
        w='100%'
        placeholder='https://www.youtube.com/watch?v=xaY01JIAcCI'
        value={youtubeUrl}
        label='YoutubeのURLを入力してください'
        onChange={(event) => setYoutubeUrl(event.currentTarget.value)}
        inputContainer={(children) => (
          <Group align='flex-start' gap='0' w='100%'>
            <Box flex={1}>{children}</Box>
            <Button onClick={handleFetchTranscript}>取得</Button>
          </Group>
        )}
      />
      <Textarea label='動画の字幕' value={transcript} readOnly minRows={5} mb={'md'} />
      <Group gap={'xs'}>
        <Button onClick={() => handleButtonClick('３行の箇条書きで要約して')}>要約</Button>
        <Button onClick={() => handleButtonClick('結論を述べてください')}>結論</Button>
      </Group>
      <MessageInput
        onSendMessage={handleSubmit}
        isResponding={isResponding}
        value={messageInputValue}
        onChange={(event) => setMessageInputValue(event.currentTarget.value)}
      />
      <Messages messages={conversation} />
    </Box>
  );
}

function SearchParamsComponent({
  setYoutubeUrl,
  youtubeUrl
}: { setYoutubeUrl: React.Dispatch<React.SetStateAction<string>>; youtubeUrl: string }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = searchParams.get('url');
    if (url && youtubeUrl === '') {
      setYoutubeUrl(url);
    }
  }, [searchParams, youtubeUrl, setYoutubeUrl]);

  return null;
}
