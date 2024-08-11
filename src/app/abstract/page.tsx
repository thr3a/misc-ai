'use client';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Center,
  CopyButton,
  Group,
  Input,
  List,
  Paper,
  Stack,
  Text,
  Textarea,
  Tooltip
} from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { generate } from './actions';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type FormValues = {
  message: string;
  loading: boolean;
  // result: string;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page() {
  const form = useForm({
    initialValues: {
      message: 'メロン',
      loading: false
    }
  });

  const handleSubmit = async (mode: 'abstract' | 'materialize'): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;

    form.setValues({ loading: true });
    const { output } = await generate(form.values.message, mode);
    form.setValues({ message: output, loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box mx='auto' component='form'>
        <Group justify='center' mt={'sm'}>
          <Button
            onClick={async () => {
              await handleSubmit('abstract');
            }}
            loading={form.values.loading}
            color={'green.5'}
          >
            抽象化
          </Button>
          <Input size='lg' {...form.getInputProps('message')} placeholder='メロン' miw={'400px'} />
          <Button
            onClick={async () => {
              await handleSubmit('materialize');
            }}
            loading={form.values.loading}
            color={'pink.5'}
          >
            具現化
          </Button>
        </Group>
      </Box>
    </FormProvider>
  );
}
