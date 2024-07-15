'use client';
import { Box, Button, CopyButton, Group, List, Textarea } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { readStreamableValue } from 'ai/rsc';
import dedent from 'ts-dedent';
import type { z } from 'zod';
import { generate } from './actions';
import type { schema } from './util';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type FormValues = {
  message: string;
  loading: boolean;
  result: z.infer<typeof schema>;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page() {
  const form = useForm({
    initialValues: {
      message: '',
      loading: false,
      result: {
        resources: []
      }
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ result: { resources: [] }, loading: true });

    const { object } = await generate(form.values.message);
    for await (const partialObject of readStreamableValue(object)) {
      if (partialObject) {
        form.setValues({ result: partialObject });
      }
    }

    form.setValues({ loading: false });
  };

  const nextPrompt = (): string => {
    return dedent`
    あなたはインフラエンジニアエキスパートです。
    入力されたシステム概要とTerraform resourceの一覧をもとに、Terraformのmain.tfファイルを作成してください。
    システム概要とリソース構造を理解できるように各ブロックの冒頭とコード内にコメントも含めてください。

    # 実装したいシステム概要
    ${form.values.message}
    # Terraformリソース一覧
    ${form.values.result.resources.map((x) => `- ${x.name}: ${x.description}`).join('\n')}

    \`\`\`hcl
    `;
  };

  return (
    <FormProvider form={form}>
      <Box mx='auto' component='form'>
        <Textarea label='構築したいシステム内容を具体的に書く' {...form.getInputProps('message')} minRows={2} maxRows={10} autosize placeholder='東京リージョンにサーバーを1台構築する' />
        <Group justify='center' mt={'sm'}>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            生成！
          </Button>
        </Group>

        {form.values.result.resources?.length > 0 && (
          <>
            <List>
              {form.values.result.resources?.map((x, index) => {
                return (
                  <List.Item key={index}>
                    {x.name}: {x.description}
                  </List.Item>
                );
              })}
            </List>

            <Group justify='flex-end'>
              <CopyButton value={nextPrompt()}>
                {({ copied, copy }) => (
                  <Button color={copied ? 'teal' : 'blue'} onClick={copy}>
                    {copied ? 'コピーしました！' : 'ChatGPTに質問するプロンプトをコピーする'}
                  </Button>
                )}
              </CopyButton>
            </Group>
          </>
        )}
      </Box>
    </FormProvider>
  );
}
