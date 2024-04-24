'use client';
import type { RequestProps } from '@/app/api/with-parser/route';
import type { ggrenSchema } from '@/app/api/with-parser/schema';
import { Box, Button, Group, Paper, Textarea } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconExternalLink } from '@tabler/icons-react';
import { PromptTemplate } from 'langchain/prompts';
import { useEffect, useState } from 'react';
import type { z } from 'zod';

type FormValues = {
  message: string;
  loading: boolean;
  result: z.infer<typeof ggrenSchema>;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

const SearchButton = ({ keyword }: { keyword: string }): JSX.Element => {
  return (
    <Button component='a' target='_blank' rel='noopener noreferrer' leftSection={<IconExternalLink size={14} />} href={`https://www.google.com/search?q=${keyword}`}>
      {keyword}
    </Button>
  );
};

export default function Page(): JSX.Element {
  const [csrfToken, setCsrfToken] = useState<string>('loading...');
  useEffect(() => {
    const el = document.querySelector('meta[name="x-csrf-token"]');
    if (el !== null) {
      setCsrfToken(el.getAttribute('content') ?? 'missing');
    }
  }, []);
  const form = useForm({
    initialValues: {
      message: '',
      // message: 'css remとpxの違い',
      loading: false,
      result: [
        // { fields: { Keyword: 'zod schema json' } },
        // { fields: { Keyword: 'zod schema JSON validation xxxxxxxxxx' } }
      ]
    }
  });

  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ result: [], loading: true });

    const prompt = PromptTemplate.fromTemplate(`
### Task:
Please list the five most suitable search keywords in English when searching Google to solve the problem written in Input.
### Input: {message}
### Output:`);
    const formattedPrompt = await prompt.format({
      message: form.values.message
    });
    console.log(formattedPrompt);
    const params: RequestProps = {
      csrfToken,
      prompt: formattedPrompt,
      type: 'ggren',
      modelParams: {
        name: 'gpt-4'
      }
    };
    const reqResponse = await fetch('/api/with-parser/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    if (reqResponse.ok) {
      const { result } = await reqResponse.json();
      form.setValues({ result, loading: false });
    } else {
      notifications.show({
        title: 'エラーが発生しました。',
        message: '再度試してみてください',
        withCloseButton: false,
        color: 'red'
      });
      form.setValues({ loading: false });
    }
  };

  return (
    <FormProvider form={form}>
      <Box maw={400} mx='auto' component='form'>
        <Textarea label='調べたい内容' {...form.getInputProps('message')} placeholder='css remとpxの違い' autosize minRows={2} maxRows={4} />
        <Group justify='flex-end'>
          <Button onClick={handleSubmit} loading={form.values.loading}>
            翻訳
          </Button>
        </Group>
        <Paper>
          {form.values.result.map((item, index) => (
            <Box key={index} mt={'md'}>
              <SearchButton keyword={item.fields.Keyword} />
            </Box>
          ))}
        </Paper>
      </Box>
    </FormProvider>
  );
}
