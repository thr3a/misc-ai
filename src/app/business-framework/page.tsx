'use client';
import { Box, Button, Divider, Flex, Group, List, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
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

const Section = (props: { name: string; description: string; reason: string; example: string }) => {
  return (
    <>
      <Title order={1} mb='xs'>
        {props.name}
      </Title>
      <div>
        <div>概要: {props.description}</div>
        <div>理由: {props.reason}</div>
        <div>例: {props.example}</div>
      </div>
    </>
  );
};

export default function Page() {
  const form = useForm({
    initialValues: {
      message: '社内の技術ブログのPVを上げたい',
      loading: false,
      result: {
        frameworks: []
      }
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({
      result: {
        frameworks: []
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
        <TextInput label='課題(具体的に)' {...form.getInputProps('message')} placeholder='かき氷' />

        <Group justify='center' mt={'sm'} mb={'sm'}>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            作成
          </Button>
        </Group>

        {form.values.result.frameworks?.map((x, index) => {
          return (
            <Section name={x.name} description={x.description} reason={x.reason} example={x.example} key={index} />
          );
        })}
      </Box>
    </FormProvider>
  );
}
