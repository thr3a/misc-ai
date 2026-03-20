'use client';

import { useChat, experimental_useObject as useObject } from '@ai-sdk/react';
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core';
import { useInputState } from '@mantine/hooks';
import { IconMicrophone, IconTrash, IconUser } from '@tabler/icons-react';
import { DefaultChatTransport } from 'ai';
import { useMemo, useState } from 'react';
import { type LyricAnalysis, lyricAnalysisSchema } from '@/app/lyric/type';
import { MessageInput, Messages } from '../example-chat/Chat';

// 関数名は変えないこと
export default function Page() {
  const [url, setUrl] = useInputState('');
  const [lyric, setLyric] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [messageInputValue, setMessageInputValue] = useInputState('');

  const {
    object: analysis,
    submit: submitAnalysis,
    isLoading: isAnalyzing
  } = useObject({
    api: '/api/lyric/analyze',
    schema: lyricAnalysisSchema
  });

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/lyric/chat'
      }),
    []
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({ transport });

  const isResponding = status === 'streaming' || status === 'submitted';
  const analysisReady = !isAnalyzing && analysis !== undefined;

  const handleFetchLyric = async () => {
    if (!url.trim()) return;
    setIsFetching(true);
    try {
      const response = await fetch('/api/lyric/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('歌詞の取得に失敗しました:', data.error);
        return;
      }
      const fetchedLyric: string = data.lyric ?? '';
      setLyric(fetchedLyric);
      submitAnalysis({ lyric: fetchedLyric });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = (input: string) => {
    if (!analysis) return;
    sendMessage({ parts: [{ type: 'text', text: input }] }, { body: { lyric, analysis: analysis as LyricAnalysis } });
    setMessageInputValue('');
  };

  return (
    <Stack gap='md' mx='auto'>
      <TextInput
        label='歌詞ページのURLを入力してください'
        placeholder='https://www.uta-net.com/song/252556/'
        value={url}
        onChange={setUrl}
      />
      <Group justify='center'>
        <Button onClick={handleFetchLyric} loading={isFetching} disabled={!url.trim()}>
          取得して分析
        </Button>
      </Group>

      {lyric && (
        <Stack gap='xs'>
          <Text size='sm' fw='bold'>
            歌詞
          </Text>
          <ScrollArea h={200} type='auto'>
            <Text size='xs' style={{ whiteSpace: 'pre-wrap' }}>
              {lyric}
            </Text>
          </ScrollArea>
        </Stack>
      )}

      {(isAnalyzing || analysis) && (
        <Stack gap='sm'>
          <Title order={4}>登場人物</Title>

          <Card withBorder p='sm'>
            <Stack gap='xs'>
              <Group gap='xs'>
                <IconMicrophone size={16} />
                <Text fw='bold' size='sm'>
                  語り手
                </Text>
              </Group>
              {isAnalyzing && !analysis?.narrator ? (
                <Stack gap='xs'>
                  <Skeleton height={14} />
                  <Skeleton height={14} width='70%' />
                </Stack>
              ) : (
                analysis?.narrator && (
                  <Stack gap='xs'>
                    <Group gap='xs'>
                      <Badge variant='light' size='sm'>
                        {analysis.narrator.gender}
                      </Badge>
                      <Badge variant='light' color='gray' size='sm'>
                        {analysis.narrator.ageGroup}
                      </Badge>
                    </Group>
                    <Text size='sm'>{analysis.narrator.description}</Text>
                  </Stack>
                )
              )}
            </Stack>
          </Card>

          {(isAnalyzing && !analysis?.characters) || (analysis?.characters && analysis.characters.length > 0) ? (
            <Stack gap='xs'>
              <Text size='sm' fw='bold'>
                その他の登場人物
              </Text>
              {isAnalyzing && !analysis?.characters ? (
                <Skeleton height={60} />
              ) : (
                analysis?.characters
                  ?.filter((c): c is NonNullable<typeof c> => c !== undefined)
                  .map((character, i) => (
                    <Card withBorder p='sm' key={i}>
                      <Stack gap='xs'>
                        <Group gap='xs'>
                          <IconUser size={16} />
                          <Text size='sm' fw='bold'>
                            登場人物{i + 1}
                          </Text>
                        </Group>
                        <Group gap='xs'>
                          <Badge variant='light' size='sm'>
                            {character.gender}
                          </Badge>
                          <Badge variant='light' color='gray' size='sm'>
                            {character.ageGroup}
                          </Badge>
                          <Text size='xs' c='dimmed'>
                            {character.relationshipWithNarrator}
                          </Text>
                        </Group>
                      </Stack>
                    </Card>
                  ))
              )}
            </Stack>
          ) : null}

          <Stack gap='xs'>
            <Text size='sm' fw='bold'>
              歌詞の概要
            </Text>
            {isAnalyzing && !analysis?.summary ? (
              <Stack gap='xs'>
                <Skeleton height={14} />
                <Skeleton height={14} />
                <Skeleton height={14} width='60%' />
              </Stack>
            ) : (
              analysis?.summary && (
                <Paper withBorder p='sm'>
                  <Text size='sm'>{analysis.summary}</Text>
                </Paper>
              )
            )}
          </Stack>
        </Stack>
      )}

      {analysisReady && (
        <Box>
          <Stack gap='sm'>
            <Group justify='space-between'>
              <Title order={4}>歌詞について考察する</Title>
              {messages.length > 0 && (
                <Button
                  variant='subtle'
                  color='red'
                  size='xs'
                  leftSection={<IconTrash size={14} />}
                  onClick={() => setMessages([])}
                >
                  チャットをリセット
                </Button>
              )}
            </Group>
            <MessageInput
              onSendMessage={handleSubmit}
              onStop={stop}
              isResponding={isResponding}
              value={messageInputValue}
              onChange={(event) => setMessageInputValue(event)}
            />
            <Messages messages={messages} />
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
