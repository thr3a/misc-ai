'use client';
import { Box, Button, Group, Table, type TableData, TextInput } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { getZaiko } from './util';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type FormValues = {
  jan: string;
  result: TableData;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page() {
  const searchParams = useSearchParams();
  const form = useForm({
    initialValues: {
      jan: '',
      result: {}
    }
  });

  useEffect(() => {
    const jan = searchParams.get('jan');
    if (jan) {
      form.setValues({ jan: jan });
    }
  }, [searchParams, form.setValues]);

  const handleSubmit = async (): Promise<void> => {
    if (form.values.jan === '') return;
    const data = await getZaiko(form.values.jan);
    form.setValues({
      result: {
        head: ['店舗名', '在庫'],
        body: data.map((x) => [x.str_name, x.zaiko])
      }
    });
  };

  const handleReset = (): void => {
    form.reset();
    form.clearErrors();
  };

  return (
    <FormProvider form={form}>
      <Box maw={400} mx='auto' component='form'>
        <TextInput label='JANコード' {...form.getInputProps('jan')} />
        <Group justify='flex-end'>
          <Button onClick={handleSubmit}>送信</Button>
          <Button color='gray' onClick={handleReset}>
            クリア
          </Button>
        </Group>

        <Table striped data={form.values.result} />
      </Box>
    </FormProvider>
  );
}
