'use client';
import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { Box, Button, Group, Select, Stack, Textarea, Title } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { useState } from 'react';
import dedent from 'ts-dedent';
import { scenarioPromptSchema } from './type';
import { buildSystemPromptFromScenario } from './util';

// 関数名は変えないこと
export default function Page() {
  const [situation, setSituation] = useLocalStorage<string>({
    key: 'rp-prompt-situation',
    defaultValue: dedent`
    中世ヨーロッパ風のファンタジー世界 魔法学校の入学式の直後
    人間がなりきるキャラクター：佐藤 ３３歳独身男性
    あなたがなりきるキャラクター1：女性、同級生
    あなたがなりきるキャラクター2：女性、先生
    `
  });
  const [provider, setProvider] = useState<'local' | 'openrouter'>('local');
  const { object, submit, isLoading, stop } = useObject({
    api: '/api/rp-prompt',
    schema: scenarioPromptSchema
  });

  const generateMarkdown = () => {
    if (!object || Object.keys(object).length === 0) {
      return '';
    }

    return buildSystemPromptFromScenario(object);
  };

  const markdown = generateMarkdown();

  return (
    <Box mb={'lg'}>
      <Select
        label='プロバイダー'
        data={[
          { value: 'local', label: 'ローカルLLM' },
          { value: 'openrouter', label: 'OpenRouter' }
        ]}
        value={provider}
        onChange={(value) => setProvider(value as 'local' | 'openrouter')}
        mb='md'
      />
      <Textarea
        label='シチュエーションを記述してください'
        withAsterisk
        value={situation}
        rows={10}
        onChange={(e) => setSituation(e.currentTarget.value)}
        styles={{ input: { fontFamily: 'monospace', fontSize: 14 } }}
      />
      <Group justify='center' mt='md'>
        <Button
          onClick={() => {
            submit({ situation, provider });
          }}
          disabled={isLoading}
          loading={isLoading}
        >
          プロンプト生成
        </Button>
      </Group>
      <Group mt='xl' mb='sm'>
        <Title order={3}>生成結果</Title>
        <ButtonCopy content={markdown} disabled={isLoading} label='コピー' />
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
