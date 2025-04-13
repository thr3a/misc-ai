'use client';
import { SuggestSearchQueries } from '@/app/ggr-en/actions';
import type { schema } from '@/app/ggr-en/util';
import { Box, Button, Group, Paper, Textarea } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { IconExternalLink } from '@tabler/icons-react';
import type { z } from 'zod';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type FormValues = {
  message: string;
  loading: boolean;
  result: z.infer<typeof schema>;
};

const SearchButton = ({ keyword }: { keyword: string }) => {
  return (
    <Button
      component='a'
      target='_blank'
      rel='noopener noreferrer'
      leftSection={<IconExternalLink size={14} />}
      href={`https://www.google.com/search?q=${keyword}`}
    >
      {keyword}
    </Button>
  );
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page() {
  const form = useForm({
    initialValues: {
      message: 'css remとpxの違い',
      loading: false,
      result: { queries: [] }
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ result: { queries: [] }, loading: true });

    const { queries } = await SuggestSearchQueries(form.values.message);

    form.setValues({ result: queries, loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box maw={400} mx='auto' component='form'>
        <Textarea
          label='調べたい内容'
          {...form.getInputProps('message')}
          placeholder='css remとpxの違い'
          minRows={2}
          maxRows={4}
        />
        <Group justify='flex-end'>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            翻訳!
          </Button>
        </Group>
        <Paper>
          {form.values.result.queries.map((item, index) => (
            <Box key={item.query} mt={'md'}>
              <SearchButton keyword={item.query} />
            </Box>
          ))}
        </Paper>
      </Box>
    </FormProvider>
  );
}
