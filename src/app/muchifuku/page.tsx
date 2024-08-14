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

const Description = () => {
  return (
    <Paper>
      <Title order={2}>無知フクロウとは？</Title>
      <Text>
        無知フクロウは、あにゃ氏が生み出した「無知」をテーマにしたユニークなフクロウのキャラクター。名の通り大抵のことを知らない。
        純粋で善意の行動が多いものの、その無知さゆえに周囲に迷惑をかけてしまう。
      </Text>
      <List>
        <List.Item>シュールでキュートな外見を持つフクロウのキャラクター</List.Item>
        <List.Item>単純で純粋な性格で、物事を深く考えずに行動する傾向がある</List.Item>
        <List.Item>「〜プ」という独特の言葉遣いをする</List.Item>
        <List.Item>社会常識や状況判断が欠如している</List.Item>
        <List.Item>LINEスタンプとして商品化されており、人気を集めている</List.Item>
      </List>
    </Paper>
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
          お題に好きなワードやシチュエーションを入れて生成ボタンを押すとAIが二次創作作ってくれます。AI作なので本家と異なった無知フクでもあしからず。
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
        <Description />
      </Box>
    </FormProvider>
  );
}
