'use client';
import { useObject } from '@ai-sdk/react';
import { Button, Group, Select, Stack, Textarea, Title } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { useState } from 'react';
import dedent from 'ts-dedent';
import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import { scenarioPromptSchema } from './type';
import { buildSystemPromptFromScenario } from './util';

const DEFAULT_SITUATION = dedent`
  中世ヨーロッパ風のファンタジー世界 魔法学校の入学式の直後
  USERがなりきる人物：佐藤（33歳・男性・独身）
  あなたがなりきる人物1：(24歳、女性、同級生)
  あなたがなりきる人物2：(24歳、女性、先生)
`;

// 関数名は変えないこと
export default function Page() {
  const [situation, setSituation] = useLocalStorage<string>({
    key: 'rp-prompt-situation',
    defaultValue: DEFAULT_SITUATION
  });
  const [provider, setProvider] = useState<'local' | 'openrouter'>('openrouter');
  const { object, submit, isLoading } = useObject({
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
    <Stack gap='lg'>
      <Select
        label='プロバイダー'
        data={[
          { value: 'local', label: 'ローカルLLM' },
          { value: 'openrouter', label: 'OpenRouter' }
        ]}
        value={provider}
        onChange={(value) => setProvider(value as 'local' | 'openrouter')}
      />
      <Textarea
        label='シチュエーションを記述してください'
        withAsterisk
        value={situation}
        rows={10}
        onChange={(e) => setSituation(e.currentTarget.value || DEFAULT_SITUATION)}
        styles={{ input: { fontFamily: 'monospace', fontSize: 14 } }}
      />
      <Group justify='center'>
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
      <Group>
        <Title order={3}>生成結果</Title>
        <ButtonCopy content={markdown} disabled={isLoading} label='コピー' />
      </Group>
      <Textarea
        readOnly
        value={markdown}
        minRows={18}
        autosize
        styles={{ input: { fontFamily: 'monospace', fontSize: 14 } }}
      />
    </Stack>
  );
}
