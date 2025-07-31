'use client';
import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import { Box, Button, Group, Stack, Textarea, Title } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { readStreamableValue } from 'ai/rsc';
import type { z } from 'zod';
import { Generate } from './actions';
import type { schema } from './util';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type CharacterSetting = {
  name: string;
  gender: string;
  age: number;
  personality: string;
  background: string;
};

type ResultType = {
  worldSetting: string;
  dialogueSceneSetting: string;
  userCharacterSetting: CharacterSetting;
  aiCharacterSetting: CharacterSetting;
  dialogueTone: string;
};

type FormValues = {
  message: string;
  loading: boolean;
  result: ResultType;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

// 関数名は変えないこと
export default function Page() {
  const initialResult: ResultType = {
    worldSetting: '',
    dialogueSceneSetting: '',
    userCharacterSetting: {
      name: '',
      gender: '',
      age: 0,
      personality: '',
      background: ''
    },
    aiCharacterSetting: {
      name: '',
      gender: '',
      age: 0,
      personality: '',
      background: ''
    },
    dialogueTone: ''
  };

  const form = useForm({
    initialValues: {
      message: '魔法学校の主人公(15)はクラスに男一人でハーレム',
      loading: false,
      result: initialResult
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ result: initialResult, loading: true });

    const { object } = await Generate(form.values.message);

    for await (const partialObject of readStreamableValue(object)) {
      if (partialObject) {
        form.setValues({ result: partialObject });
      }
    }

    form.setValues({ loading: false });
  };

  // マークダウン形式でまとめる
  const toMarkdown = (result: ResultType) => {
    // 各プロパティがundefinedの場合の安全なデフォルト値
    const user = result.userCharacterSetting ?? {
      name: '',
      gender: '',
      age: 0,
      personality: '',
      background: ''
    };
    const ai = result.aiCharacterSetting ?? {
      name: '',
      gender: '',
      age: 0,
      personality: '',
      background: ''
    };
    return [
      `## 世界観の設定\n${result.worldSetting ?? ''}`,
      `## 対話シーンの設定\n${result.dialogueSceneSetting ?? ''}`,
      '## ユーザーがなりきる人物の設定',
      `- 名前: ${user.name ?? ''}`,
      `- 性別: ${user.gender ?? ''}`,
      `- 年齢: ${user.age ?? 0}`,
      `- 性格: ${user.personality ?? ''}`,
      `- 背景設定: ${user.background ?? ''}`,
      '## あなたがなりきる人物の設定',
      `- 名前: ${ai.name ?? ''}`,
      `- 性別: ${ai.gender ?? ''}`,
      `- 年齢: ${ai.age ?? 0}`,
      `- 性格: ${ai.personality ?? ''}`,
      `- 背景設定: ${ai.background ?? ''}`,
      `## 対話のトーン\n${result.dialogueTone ?? ''}`
    ].join('\n');
  };

  const markdown = toMarkdown(form.values.result);

  return (
    <FormProvider form={form}>
      <Box maw={600} mx='auto' component='form'>
        <Textarea
          label='シチュエーションを記述してください'
          withAsterisk
          {...form.getInputProps('message')}
          placeholder='例: 放課後の教室で…'
          minRows={3}
        />
        <Group justify='center' mt='md'>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            プロンプト生成
          </Button>
        </Group>
        <Group mt='xl' mb='sm'>
          <Title order={3}>生成結果</Title>
        </Group>
        <Stack gap={4}>
          <Group justify='flex-end'>
            <ButtonCopy content={markdown} label='コピー' />
          </Group>
          <Textarea
            readOnly
            value={markdown}
            minRows={18}
            autosize
            styles={{ input: { fontFamily: 'monospace', fontSize: 14 } }}
          />
        </Stack>
      </Box>
    </FormProvider>
  );
}
