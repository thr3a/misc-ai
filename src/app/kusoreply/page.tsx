'use client';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  CopyButton,
  Group,
  List,
  Paper,
  Stack,
  Text,
  Textarea,
  Tooltip
} from '@mantine/core';
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

const Tweet = (props: { content: string }) => {
  return (
    <div>
      <Group>
        <Avatar src='https://assets.st-note.com/img/1676155437876-5NNUYKTjTE.png' radius='xl' />
        <div>
          <Text size='sm'>クソリプマン</Text>
          <Text size='xs' c='dimmed'>
            8時間10分前
          </Text>
        </div>
      </Group>
      <Text pl={54} pt='sm' size='sm'>
        {props.content}
      </Text>
    </div>
  );
};

export default function Page() {
  const form = useForm({
    initialValues: {
      message: '朝ごはんにバナナ食べたけどもうおなかすいちゃった！',
      loading: false,
      result: { replies: [] }
      // result: { replies: [{ tweet: 'やほおー' }] }
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ result: { replies: [] }, loading: true });

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
        <Textarea label='元ツイート' {...form.getInputProps('message')} minRows={2} maxRows={10} autosize />
        <Group justify='center' mt={'sm'}>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            クソリプ生成！
          </Button>
        </Group>

        {form.values.result.replies?.length > 0 && (
          <>
            <Stack mt={'sm'} gap='md'>
              {form.values.result.replies?.map((x, index) => {
                return <Tweet content={x.tweet} key={index} />;
              })}
            </Stack>
          </>
        )}
      </Box>
    </FormProvider>
  );
}
