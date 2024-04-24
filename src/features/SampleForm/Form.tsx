'use client';

import { Box, Button, Group, NumberInput, TextInput } from '@mantine/core';
import { createFormContext } from '@mantine/form';
type FormValues = {
  name: string;
  age: number;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

function NameInput(): JSX.Element {
  const form = useFormContext();
  return <TextInput label='氏名' {...form.getInputProps('name')} />;
}

export function SampleForm(): JSX.Element {
  const form = useForm({
    initialValues: {
      age: 20,
      name: ''
    }
  });

  const handleSubmit = (): void => {
    console.log(form.values);
  };

  const handleReset = (): void => {
    form.reset();
    form.clearErrors();
  };

  return (
    <FormProvider form={form}>
      <Box
        component='form'
        maw={400}
        mx='auto'
        onSubmit={form.onSubmit(() => {
          handleSubmit();
        })}
      >
        <NameInput />
        <NumberInput label='年齢' {...form.getInputProps('age')} />
        <Group justify='flex-end'>
          <Button type='submit'>送信</Button>
          <Button type='button' color='gray' onClick={handleReset}>
            クリア
          </Button>
        </Group>
      </Box>
    </FormProvider>
  );
}
