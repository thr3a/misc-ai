'use client';
import { SuggestNames } from '@/app/meimei/actions';
import { type schema, supportedNamingConventions } from '@/app/meimei/util';
import { ActionIcon, Box, Button, CopyButton, Group, Radio, Stack, TextInput, Title, Tooltip } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import type { z } from 'zod';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type FormValues = {
  message: string;
  loading: boolean;
  result: z.infer<typeof schema>;
  type: '変数名' | 'メソッド名' | 'ブランチ名' | 'GitHubのプロジェクト名';
  namingConvention: 'camel case' | 'pascal case' | 'snake case' | 'kebab case';
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page() {
  const form = useForm({
    initialValues: {
      message: '',
      loading: false,
      result: {
        candidates: ['isPrime', 'checkPrime', 'primeChecker', 'validatePrime'].map((candidate) => ({ candidate }))
      },
      namingConvention: 'camel case',
      type: '変数名'
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ result: { candidates: [] }, loading: true });

    const { candidates } = await SuggestNames(form.values.message, form.values.type, form.values.namingConvention);

    form.setValues({ result: candidates, loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box maw={600} mx='auto' component='form'>
        <Radio.Group label='名前の種類' {...form.getInputProps('type')}>
          <Group mt='xs'>
            <Radio value='変数名' label='変数名' />
            <Radio value='メソッド名' label='関数名' />
            <Radio value='ブランチ名' label='ブランチ名' />
            <Radio value='GitHubのプロジェクト名' label='GitHubのプロジェクト名' />
          </Group>
        </Radio.Group>
        <TextInput
          label='処理の概要をなるべく詳しく記述してください'
          withAsterisk
          {...form.getInputProps('message')}
          placeholder='素数かどうか判定する関数'
        />
        <Radio.Group label='命名規則' {...form.getInputProps('namingConvention')}>
          <Stack mt='xs'>
            {supportedNamingConventions.map((nc) => (
              <Radio key={nc.label} value={nc.name} label={nc.label} />
            ))}
          </Stack>
        </Radio.Group>

        <Group justify='center'>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            作成!
          </Button>
        </Group>
        <Group mt='sm' mb='sm'>
          <Title order={2}>生成結果</Title>
        </Group>

        <Stack gap='sm'>
          {form.values.result.candidates.map((x) => (
            <TextInput
              readOnly
              key={x.candidate}
              value={x.candidate.trim()}
              rightSectionPointerEvents='all'
              rightSection={
                <CopyButton value={x.candidate.trim()}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'コピーしました' : 'コピー'} withArrow position='left'>
                      <ActionIcon color={copied ? 'teal' : 'blue'} onClick={copy} size='input-sm'>
                        {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              }
            />
          ))}
        </Stack>
      </Box>
    </FormProvider>
  );
}
