'use client';
import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { Box, Button, Group, Stack, Textarea, Title } from '@mantine/core';
import { useState } from 'react';
import { schema } from './util';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// 関数名は変えないこと
export default function Page() {
  const [situation, setSituation] = useState('魔法学校の主人公(15)はクラスに男一人でハーレム');
  const { object, submit, isLoading, stop } = useObject({
    api: '/api/rp-prompt',
    schema: schema
  });

  const user = object?.userCharacterSetting;
  const ai = object?.aiCharacterSetting;
  const markdown =
    !object || Object.keys(object).length === 0
      ? ''
      : [
          `# 世界観の設定\n${object.worldSetting ?? ''}`,
          `# 対話シーンの設定\n${object.dialogueSceneSetting ?? ''}`,
          '# ユーザーがなりきる人物の設定',
          `- 名前: ${user?.name ?? ''}`,
          `- 性別: ${user?.gender ?? ''}`,
          `- 年齢: ${user?.age ?? 0}`,
          `- 一人称: ${user?.firstPersonPronoun ?? ''}`,
          `- 二人称: ${user?.secondPersonPronoun ?? ''}`,
          `- 性格: ${user?.personality ?? ''}`,
          `- 背景設定: ${user?.background ?? ''}`,
          '# あなたがなりきる人物の設定',
          `- 名前: ${ai?.name ?? ''}`,
          `- 性別: ${ai?.gender ?? ''}`,
          `- 年齢: ${ai?.age ?? 0}`,
          `- 一人称: ${ai?.firstPersonPronoun ?? ''}`,
          `- 二人称: ${ai?.secondPersonPronoun ?? ''}`,
          `- 性格: ${ai?.personality ?? ''}`,
          `- 背景設定: ${ai?.background ?? ''}`,
          `# 対話のトーン\n${object.dialogueTone ?? ''}`,
          `# ユーザーとあなたがなりきる人物との関係性の設定\n${object.relationshipSetting ?? ''}`
        ].join('\n');

  return (
    <Box maw={600} mx='auto' component='form'>
      <Textarea
        label='シチュエーションを記述してください'
        withAsterisk
        placeholder='例: 放課後の教室で…'
        minRows={3}
        value={situation}
        onChange={(e) => setSituation(e.currentTarget.value)}
      />
      <Group justify='center' mt='md'>
        <Button onClick={() => submit(situation)} disabled={isLoading} loading={isLoading}>
          プロンプト生成
        </Button>
      </Group>
      <Group mt='xl' mb='sm'>
        <Title order={3}>生成結果</Title>
        <ButtonCopy content={markdown} disabled={isLoading} />
      </Group>
      <Stack gap={4}>
        <Textarea
          readOnly
          value={markdown}
          minRows={18}
          autosize
          styles={{ input: { fontFamily: 'monospace', fontSize: 14 } }}
        />
      </Stack>
    </Box>
  );
}
