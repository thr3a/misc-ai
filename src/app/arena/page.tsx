'use client';
import { ActionIcon, Avatar, Box, Button, CopyButton, Group, List, Paper, Stack, Text, Textarea, Tooltip } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { readStreamableValue } from 'ai/rsc';
import { generate } from './actions';
import type { MessageProps } from './util';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type FormValues = {
  message: string;
  loading: boolean;
  result: MessageProps[];
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

const Tweet = (props: { content: string }) => {
  return (
    <div>
      <Group>
        <div>
          <Text size='sm'>{props.content}</Text>
        </div>
      </Group>
    </div>
  );
};

export default function Page() {
  const form = useForm({
    initialValues: {
      message: '',
      loading: false,
      result: []
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ result: [], loading: true });

    const tmpMessages: MessageProps[] = [];

    for (let index = 0; index < 5; index++) {
      form.insertListItem('result', [{ role: 'user', content: '' }]);
      const lastMessage = tmpMessages.at(-1);
      const { messages, newMessage } = await generate(form.values.message, lastMessage ? [lastMessage] : []);
      let OpinionText = '';

      for await (const delta of readStreamableValue(newMessage)) {
        OpinionText = `${OpinionText}${delta}`;
        form.setFieldValue(`result.${index}.content`, OpinionText);
      }
      tmpMessages.push({ role: 'user', content: OpinionText });
      console.log(tmpMessages);
    }

    form.setValues({ loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box mx='auto' component='form'>
        <Textarea label='議題' {...form.getInputProps('message')} minRows={2} maxRows={10} autosize placeholder='どのお寿司のネタが一番美味しいか' />
        <Group justify='center' mt={'sm'}>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            討論開始！
          </Button>
        </Group>

        <Stack mt={'sm'} gap='md'>
          {form.values.result?.map((x, index) => {
            return <Tweet content={x.content} key={index} />;
          })}
        </Stack>
      </Box>
    </FormProvider>
  );
}
