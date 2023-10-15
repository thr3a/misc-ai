'use client';
import { createFormContext, isNotEmpty } from '@mantine/form';
import { Box, Group, Button, Radio, Grid, TextInput, Stack, Title, CopyButton } from '@mantine/core';
import { type RequestProps } from '@/app/api/list-parser/route';
import { useState, useEffect } from 'react';
import { PromptTemplate } from 'langchain/prompts';
import { notifications } from '@mantine/notifications';
import { supportedNamingConventions } from './utils';

type FormValues = {
  type: 'variable' | 'function' | 'branch'
  purpose: string
  candidates: string[]
  namingConvention: 'camel case' | 'pascal case' | 'snake case' | 'kebab case'
  loading: boolean
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page (): JSX.Element {
  const [csrfToken, setCsrfToken] = useState<string>('loading...');
  useEffect(() => {
    const el = document.querySelector('meta[name="x-csrf-token"]');
    if (el !== null) {
      setCsrfToken(el.getAttribute('content') ?? 'missing');
    }
  }, []);
  const form = useForm({
    initialValues: {
      loading: false,
      type: 'variable',
      purpose: '素数かどうか判定する関数',
      candidates: ['isPrime', 'checkPrime', 'primeChecker', 'validatePrime'],
      namingConvention: 'camel case'
    },
    validate: {
      purpose: isNotEmpty('概要は必須項目です')
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.purpose === '') return;
    if (form.values.loading) return;

    form.setValues({ candidates: [], loading: true });

    const prompt = PromptTemplate.fromTemplate(`
# Task
Please suggest 6 appropriate ${form.values.type} names in ${form.values.namingConvention} format that are suitable for the overview.
# Overview
${form.values.purpose}`);
    const formattedPrompt = await prompt.format({ prompt });
    console.log(formattedPrompt);
    const params: RequestProps = {
      csrfToken,
      prompt: formattedPrompt,
      modelParams: {
        name: 'gpt-4',
        temperature: 0
      }
    };
    const reqResponse = await fetch('/api/list-parser/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    if (reqResponse.ok) {
      const { result } = await reqResponse.json();
      form.setValues({ candidates: result, loading: false });
    } else {
      notifications.show({
        title: 'エラーが発生しました。',
        message: '再度試してみてください',
        withCloseButton: false,
        color: 'red'
      });
      form.setValues({ loading: false });
    }
  };

  return (
    <FormProvider form={form}>
      <Box maw={600} mx="auto" component="form">
        <Radio.Group label="名前の種類" {...form.getInputProps('type')}>
          <Group mt="xs">
            <Radio value='variable' label='変数名' />
            <Radio value='function' label='関数名' />
            <Radio value='branch' label='ブランチ名' />
          </Group>
        </Radio.Group>
        <TextInput label='処理の概要を記述してください' withAsterisk {...form.getInputProps('purpose')} placeholder='素数かどうか判定する関数'/>
        <Radio.Group label="命名規則" {...form.getInputProps('namingConvention')}>
          <Stack mt="xs">
            {supportedNamingConventions.map((nc, index) => (
              <Radio key={index} value={nc.name} label={nc.label} />
            ))}
          </Stack>
        </Radio.Group>

        <Group justify="center">
          <Button onClick={handleSubmit} loading={form.values.loading}>作成!</Button>
        </Group>
        <Group mt="sm" mb="sm">
          <Title order={2}>生成結果</Title>
        </Group>

        {form.values.candidates.map((candidate, index) => (
          <Grid key={index}>
            <Grid.Col span={6}>
              <TextInput
                value={candidate.trim()} size="md" readOnly
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <CopyButton value={candidate.trim()}>
                {({ copied, copy }) => (
                  <Button color={copied ? 'teal' : 'blue'} onClick={copy} size="xs" variant="light">
                    {copied ? 'コピーしました！' : 'クリップボードにコピー'}
                  </Button>
                )}
              </CopyButton>
            </Grid.Col>
          </Grid>
        ))}
      </Box>
    </FormProvider>
  );
}
