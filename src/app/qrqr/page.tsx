'use client';
import { Box, Button, Group, Paper, TextInput, Textarea, Title } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { readStreamableValue } from 'ai/rsc';
import { QRCodeSVG } from 'qrcode.react';
import { generate } from './actions';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type FormValues = {
  message: string;
  loading: boolean;
  result: string;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page() {
  const form = useForm({
    initialValues: {
      message: '',
      loading: false,
      result: ''
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({
      result: '',
      loading: true
    });

    const { output } = await generate(form.values.message);
    let tmp = '';

    for await (const delta of readStreamableValue(output)) {
      tmp = `${tmp}${delta}`;
      form.setFieldValue('result', tmp);
    }
    console.log(tmp);
    form.setValues({ loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box mx='auto' component='form'>
        <Textarea label='テキスト' {...form.getInputProps('message')} placeholder='今日役立つ格言を教えてください！' />
        <Group justify='center' mt={'sm'} mb={'sm'}>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            送信！
          </Button>
        </Group>

        <Group justify='center' mt={'sm'} mb={'sm'}>
          <QRCodeSVG size={256} value={form.values.result || 'なにか話しかけてください'} />
        </Group>
      </Box>
    </FormProvider>
  );
}
