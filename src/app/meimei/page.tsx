'use client';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { ActionIcon, Button, CopyButton, Group, Radio, Stack, TextInput, Title, Tooltip } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { useState } from 'react';
import { schema, supportedNamingConventions } from '@/app/meimei/util';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type NameType = '変数名' | 'メソッド名' | 'ブランチ名' | 'GitHubのプロジェクト名';
type NamingConvention = 'camel case' | 'pascal case' | 'snake case' | 'kebab case';

const DEFAULT_CANDIDATES = ['isPrime', 'checkPrime', 'primeChecker', 'validatePrime', 'isPrimeNumber', 'primeTester'];

export default function Page() {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NameType>('変数名');
  const [namingConvention, setNamingConvention] = useState<NamingConvention>('camel case');

  const { object, submit, isLoading } = useObject({
    api: '/api/meimei',
    schema
  });

  const candidates = object?.candidates ?? DEFAULT_CANDIDATES.map((c) => ({ candidate: c }));

  const handleSubmit = () => {
    if (message === '' || isLoading) return;
    submit({ input: message, type, namingConvention });
  };

  return (
    <Stack gap='lg'>
      <Radio.Group label='名前の種類' value={type} onChange={(value) => setType(value as NameType)}>
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
        value={message}
        onChange={(e) => setMessage(e.currentTarget.value)}
        placeholder='素数かどうか判定する関数'
      />
      <Radio.Group
        label='命名規則'
        value={namingConvention}
        onChange={(value) => setNamingConvention(value as NamingConvention)}
      >
        <Stack mt='xs'>
          {supportedNamingConventions.map((nc) => (
            <Radio key={nc.label} value={nc.name} label={nc.label} />
          ))}
        </Stack>
      </Radio.Group>
      <Group justify='center'>
        <Button onClick={handleSubmit} loading={isLoading}>
          作成!
        </Button>
      </Group>
      <Stack gap='sm' w='100%' maw={400} mx='auto'>
        <Title order={2}>生成結果</Title>
        {candidates.map(
          (x) =>
            x && (
              <TextInput
                readOnly
                key={x.candidate}
                value={x.candidate?.trim() ?? ''}
                rightSectionPointerEvents='all'
                rightSection={
                  <CopyButton value={x.candidate?.trim() ?? ''}>
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
            )
        )}
      </Stack>
    </Stack>
  );
}
