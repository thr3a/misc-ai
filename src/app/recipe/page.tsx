'use client';
import { Box, Button, Group, Select, TextInput, Textarea, Title } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import dedent from 'ts-dedent';
import type { z } from 'zod';
import { Generate } from './actions';
import { formatRecipeResult, type schema } from './util';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type FormValues = {
  recipeName: string;
  includeIngredients: string;
  excludeIngredients: string;
  other: string;
  servings: string;
  loading: boolean;
  result: z.infer<typeof schema> | null;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page() {
  const form = useForm({
    initialValues: {
      recipeName: '',
      includeIngredients: '',
      excludeIngredients: '',
      other: '',
      servings: '1',
      loading: false,
      result: null
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.loading) return;

    form.setValues({ result: null, loading: true });

    const prompt = dedent`
    料理名/作りたい料理のテーマ: ${form.values.recipeName}
    絶対いれる材料: ${form.values.includeIngredients}
    絶対入れない材料: ${form.values.excludeIngredients}
    その他: ${form.values.other}
    人数: ${form.values.servings}
  `;

    const { object } = await Generate(prompt);

    for await (const partialObject of (await import('ai/rsc')).readStreamableValue(object)) {
      if (partialObject) {
        form.setValues({ result: partialObject });
      }
    }

    form.setValues({ loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box
        component='form'
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <TextInput
          label='料理名/作りたい料理のテーマ(任意)'
          placeholder='例: もやしを使った辛いスープ'
          {...form.getInputProps('recipeName')}
          mb='sm'
        />
        <TextInput
          label='絶対入れる材料(任意)'
          placeholder='例: もやし250g、ラー油、豆板醤、卵'
          {...form.getInputProps('includeIngredients')}
          mb='sm'
        />
        <TextInput
          label='絶対入れない材料（任意）'
          placeholder='例: 卵'
          {...form.getInputProps('excludeIngredients')}
          mb='sm'
        />
        <Textarea
          label='その他希望（任意）'
          placeholder='例: 簡単に作れるもの、和風がいい'
          autosize
          minRows={2}
          {...form.getInputProps('other')}
          mb='sm'
        />
        <Select
          label='人数'
          data={Array.from({ length: 8 }, (_, i) => ({
            value: String(i + 1),
            label: `${i + 1}人分`
          }))}
          defaultValue='1'
          {...form.getInputProps('servings')}
          mb='md'
        />
        <Group justify='center'>
          <Button type='submit' loading={form.values.loading}>
            レシピを提案
          </Button>
        </Group>
        <Group mt='sm' mb='sm'>
          <Title order={2}>提案レシピ</Title>
        </Group>
        <Textarea readOnly autosize minRows={10} value={formatRecipeResult(form.values.result)} />
      </Box>
    </FormProvider>
  );
}
