'use client';
import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { Button, Group, Radio, Select, Stack, Textarea, Title } from '@mantine/core';
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
    USERがなりきる人物：佐藤（33歳・男性・独身）
    あなたがなりきる人物1：(24歳、女性、同級生)
    あなたがなりきる人物2：(24歳、女性、先生)
    `
  });
  const [provider, setProvider] = useState<'local' | 'openrouter'>('openrouter');
  const [mode, setMode] = useState<'expansion' | 'creative'>('expansion');
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
        onChange={(e) => setSituation(e.currentTarget.value)}
        styles={{ input: { fontFamily: 'monospace', fontSize: 14 } }}
      />
      <Radio.Group label='モード' value={mode} onChange={(value) => setMode(value as 'expansion' | 'creative')}>
        <Group mt='xs'>
          <Radio value='expansion' label='拡張' />
          <Radio value='creative' label='創作' />
        </Group>
      </Radio.Group>
      <Group justify='center'>
        <Button
          onClick={() => {
            submit({ situation, provider, mode });
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
