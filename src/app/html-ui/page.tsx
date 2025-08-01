'use client';
import { readStreamableValue } from '@ai-sdk/rsc';
import { Box, Button, Group, Textarea, Title } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import type { z } from 'zod';
import { ButtonCopy } from './ButtonCopy';
import { generate } from './actions';
import { examplePrompt, type schema } from './util';

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
      message: examplePrompt,
      loading: false,
      result: {
        html: ''
      }
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({
      result: {
        html: ''
      },
      loading: true
    });

    const { object } = await generate(form.values.message);
    for await (const partialObject of readStreamableValue(object)) {
      if (partialObject) {
        form.setValues({ result: partialObject });
      }
    }

    form.setValues({ loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box mx='auto' component='form'>
        <Textarea
          rows={5}
          label='作成したいUIを説明してください'
          {...form.getInputProps('message')}
          placeholder='example'
        />
        <Group justify='center' mt={'sm'} mb={'sm'}>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            作成
          </Button>
        </Group>
      </Box>
      <Box mt={'md'}>
        <Title order={4} mb='xs'>
          プレビュー
        </Title>
        <iframe
          title='HTML Preview'
          srcDoc={`
            <!doctype html>
            <html>
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
              </head>
              <body>
                ${form.values.result.html}
              </body>
            </html>
`}
          style={{ width: '100%', height: '700px', border: '1px solid #ccc' }}
        />
      </Box>
      <Box mb={'lg'}>
        <Textarea label='ソースコード' readOnly value={form.values.result.html} rows={10} />
        <ButtonCopy content={form.values.result.html} label='コピー' />
      </Box>
    </FormProvider>
  );
}
