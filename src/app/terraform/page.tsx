'use client';
import { Box, Button, Group, List, Textarea } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { readStreamableValue } from 'ai/rsc';
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
      message: '作成済みのAmazon SESのメールアドレス test@example.com にメールを受信したら、AWS Lambda を使って Discord の特定のチャンネルにタイトル、送信者（From）、内容を投稿したい',
      loading: false,
      result: { resources: [] }
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

  return (
    <FormProvider form={form}>
      <Box mx='auto' component='form'>
        <Textarea label='構築したいシステム内容を具体的に書く' {...form.getInputProps('message')} minRows={2} maxRows={10} autosize />
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
          </>
        )}
      </Box>
    </FormProvider>
  );
}
