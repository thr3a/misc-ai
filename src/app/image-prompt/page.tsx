'use client';

import { Alert, Box, Button, Divider, Group, Radio, Select, SimpleGrid, Stack, Textarea } from '@mantine/core';
import { useState } from 'react';
import { z } from 'zod';
import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import { type ModelId, SYSTEM_PROMPTS } from './util';

type Version = {
  label: string;
  text: string;
  english: string;
};

const MODELS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'local', label: 'ローカルLLM' }
];

const responseSchema = z.object({ text: z.string() });

// APIを呼び出して結果テキストを返す。失敗時は null
const callApi = async (body: Record<string, string>) => {
  const res = await fetch('/api/image-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) return null;
  const parsed = responseSchema.safeParse(await res.json());
  return parsed.success ? parsed.data.text : null;
};

// 関数名は変えないこと
export default function Page() {
  const [prompt, setPrompt] = useState('カフェで飲んでる少女');
  const [systemPromptId, setSystemPromptId] = useState(SYSTEM_PROMPTS[0].value);
  const [model, setModel] = useState<ModelId>('openai');
  const [versions, setVersions] = useState<Version[]>([]);
  const [current, setCurrent] = useState(0);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState('');

  const currentVersion = versions[current];
  const systemPrompt = SYSTEM_PROMPTS.find((p) => p.value === systemPromptId) ?? SYSTEM_PROMPTS[0];

  // 日本語プロンプト出力後に自動で翻訳し、該当バージョンに英語を保持する
  const translateVersion = async (label: string, text: string) => {
    setTranslating(true);
    const english = (await callApi({ mode: 'translate', model, prompt: text })) ?? '';
    if (!english) setError('翻訳に失敗しました');
    setVersions((prev) => prev.map((v) => (v.label === label ? { ...v, english } : v)));
    setTranslating(false);
  };

  const handleExpand = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    const text = await callApi({ mode: 'expand', model, prompt, systemPrompt: systemPrompt.prompt });
    if (!text) {
      setError('拡張に失敗しました');
      setLoading(false);
      return;
    }
    // 元入力を v0、拡張結果を v1 として履歴をリセットする
    setVersions([
      { label: 'v0', text: prompt, english: '' },
      { label: 'v1', text, english: '' }
    ]);
    setCurrent(1);
    setLoading(false);
    await translateVersion('v1', text);
  };

  const handleRevise = async () => {
    if (!currentVersion || !instruction.trim()) return;
    setLoading(true);
    setError('');
    const text = await callApi({ mode: 'revise', model, prompt: currentVersion.text, instruction });
    if (!text) {
      setError('修正に失敗しました');
      setLoading(false);
      return;
    }
    // 過去バージョン選択中でも末尾に新バージョンを追加する
    const label = `v${versions.length}`;
    setVersions((prev) => [...prev, { label, text, english: '' }]);
    setCurrent(versions.length);
    setInstruction('');
    setLoading(false);
    await translateVersion(label, text);
  };

  const englishText = currentVersion?.english || (translating && current > 0 ? '翻訳中...' : '');

  return (
    <Stack>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Select
          label='拡張システムプロンプト'
          data={SYSTEM_PROMPTS.map(({ value, label }) => ({ value, label }))}
          value={systemPromptId}
          onChange={(v) => v && setSystemPromptId(v)}
          allowDeselect={false}
        />
        <Radio.Group
          label='AIモデル'
          value={model}
          onChange={(v) => {
            if (v === 'openai' || v === 'local') setModel(v);
          }}
        >
          <Group mt='xs'>
            {MODELS.map((m) => (
              <Radio key={m.value} value={m.value} label={m.label} />
            ))}
          </Group>
        </Radio.Group>
      </SimpleGrid>

      <Textarea
        label='拡張したい画像生成プロンプト(日本語OK)'
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.currentTarget.value)}
      />
      <Group justify='flex-end'>
        <Button onClick={handleExpand} loading={loading} disabled={!prompt.trim()}>
          拡張
        </Button>
      </Group>

      {error && <Alert color='red'>{error}</Alert>}

      {currentVersion && (
        <>
          <Divider label='生成結果' labelPosition='center' />

          <Group gap='xs'>
            {versions.map((v, i) => (
              <Button
                key={v.label}
                size='xs'
                variant={i === current ? 'filled' : 'default'}
                onClick={() => setCurrent(i)}
              >
                {v.label}
              </Button>
            ))}
          </Group>

          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <Textarea
              label={
                <Group justify='space-between'>
                  <Box>日本語</Box>
                  <ButtonCopy content={currentVersion.text} label='コピー' />
                </Group>
              }
              rows={10}
              value={currentVersion.text}
              readOnly
            />
            <Textarea
              label={
                <Group justify='space-between'>
                  <Box>英語</Box>
                  <ButtonCopy content={currentVersion.english} disabled={!currentVersion.english} label='コピー' />
                </Group>
              }
              rows={10}
              value={englishText}
              placeholder={current === 0 ? 'v0 は元入力のため翻訳しません' : ''}
              readOnly
            />
          </SimpleGrid>

          <Group align='flex-end' wrap='nowrap'>
            <Textarea
              flex={1}
              label={`追加指示（${currentVersion.label} を修正して新バージョンを作成）`}
              rows={2}
              value={instruction}
              onChange={(e) => setInstruction(e.currentTarget.value)}
            />
            <Button onClick={handleRevise} loading={loading} disabled={!instruction.trim()}>
              送信
            </Button>
          </Group>
        </>
      )}
    </Stack>
  );
}
