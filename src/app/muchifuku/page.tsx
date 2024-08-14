'use client';
import { Box, Button, Divider, Flex, Group, Stack, Text, TextInput } from '@mantine/core';
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

const Section = (props: { index: number; description: string; dialogues: string[] }) => {
  const array = ['起', '承', '転', '結'];
  return (
    <>
      <Flex gap={'sm'}>
        <Text size='xl' fw={'bold'}>
          {array[props.index]}
        </Text>
        <div>
          <Text size='sm' mb={'sm'}>
            {props.description}
          </Text>
          {props.dialogues?.map((x, index) => {
            return (
              <Text size='sm' key={index}>
                {x}
              </Text>
            );
          })}
        </div>
      </Flex>
    </>
  );
};

export default function Page() {
  const form = useForm({
    initialValues: {
      message: '',
      loading: false,
      result: {
        title: '',
        sections: []
      }
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({
      result: {
        title: '',
        sections: [
          {
            description: '',
            dialogues: []
          }
        ]
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
        <Text size='sm'>
          お題に好きなワードやシチュエーションを入れて生成ボタンを押すとAIが二次創作作ってくれます。
        </Text>
        <TextInput label='お題' {...form.getInputProps('message')} placeholder='かき氷' />
        <Group justify='center' mt={'sm'}>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            4コマ生成!
          </Button>
        </Group>

        <Divider my='md' />
        <Stack mt={'sm'} gap='xl'>
          <Text size='xl' fw={'bold'}>
            {form.values.result.title}
          </Text>
          {form.values.result.sections?.map((x, index) => {
            return <Section index={index} description={x.description} dialogues={x.dialogues} key={index} />;
          })}
        </Stack>
      </Box>
    </FormProvider>
  );
}
