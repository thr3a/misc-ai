'use client';
import { Alert, Anchor, Box, Button, Group, Stack, TextInput } from '@mantine/core';
import { useState } from 'react';
import { type PostResult, postToNote } from './actions';
import { isYahooForumUrl } from './util';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default function Page() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PostResult | null>(null);

  const handleSubmit = async (): Promise<void> => {
    if (loading) return;
    if (!isYahooForumUrl(url)) {
      setResult({ ok: false, error: 'Yahoo!ファイナンス掲示板のURLを入力してください' });
      return;
    }

    setResult(null);
    setLoading(true);
    setResult(await postToNote(url));
    setLoading(false);
  };

  return (
    <Box mx='auto' maw={600}>
      <Stack>
        <TextInput
          label='Yahoo!ファイナンス掲示板のURL'
          placeholder='https://finance.yahoo.co.jp/quote/285A.T/forum/1772641'
          value={url}
          onChange={(event) => setUrl(event.currentTarget.value)}
        />
        <Group justify='center'>
          <Button onClick={handleSubmit} loading={loading}>
            送信
          </Button>
        </Group>

        {result?.ok === true && (
          <Alert color='green' title='投稿しました'>
            <Anchor href={result.url} target='_blank' rel='noopener noreferrer'>
              {result.url}
            </Anchor>
          </Alert>
        )}
        {result?.ok === false && (
          <Alert color='red' title='投稿に失敗しました'>
            <Box style={{ whiteSpace: 'pre-wrap' }}>{result.error}</Box>
          </Alert>
        )}
      </Stack>
    </Box>
  );
}
