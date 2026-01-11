'use client';

import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { Box, Button, Group, Stack, Textarea, Title } from '@mantine/core';
import { useState } from 'react';
import { schema } from './type';

// 関数名は変えないこと
export default function Page() {
  const [prompt, setPrompt] = useState('女子高生がラーメンを食べているアニメ風イラスト');
  const { object, submit, isLoading } = useObject({
    api: '/api/t2i-prompt',
    schema
  });

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    submit({ prompt });
  };

  const magicPrompt = 'Ultra HD, 4K, cinematic composition';
  const expandedPrompt = object?.expanded_prompt ? `${magicPrompt}, ${object.expanded_prompt}` : '';
  const expandedPromptJa = object?.expanded_prompt_ja ?? '';

  return (
    <Box>
      <Stack>
        <Textarea
          label='拡張したい画像生成プロンプト(日本語OK)'
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.currentTarget.value)}
        />
        <Group justify='center'>
          <Button onClick={handleSubmit} loading={isLoading} disabled={!prompt.trim()}>
            プロンプト拡張
          </Button>
        </Group>
        {expandedPrompt && (
          <Stack gap={'xs'}>
            <Textarea
              label={
                <Group justify='space-between'>
                  <Box>拡張後のプロンプト</Box>
                  <ButtonCopy content={expandedPrompt} disabled={!expandedPromptJa} label='コピー' />
                </Group>
              }
              value={expandedPrompt}
              readOnly
              rows={10}
            />

            <Textarea
              label={
                <Group justify='space-between'>
                  <Box>日本語訳</Box>
                </Group>
              }
              value={expandedPromptJa}
              readOnly
              rows={10}
            />
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
