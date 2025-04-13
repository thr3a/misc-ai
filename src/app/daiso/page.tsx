'use client';
import { Box, Button, Group, LoadingOverlay, Table, type TableData, TextInput } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { getZaiko } from './util';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type FormValues = {
  jan: string;
  result: TableData;
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

// useSearchParams を使用し、フォームの主要部分を描画するコンポーネント
function DaisoFormContent() {
  const searchParams = useSearchParams();
  const form = useFormContext();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const jan = searchParams.get('jan');
    if (jan && form.values.jan === '') {
      form.setFieldValue('jan', jan);
    }
  }, [searchParams, form]);

  const handleSubmit = async (): Promise<void> => {
    if (form.values.jan === '') return;
    setLoading(true);
    form.setFieldValue('result', { head: [], body: [] });
    try {
      const data = await getZaiko(form.values.jan);
      form.setFieldValue('result', {
        head: ['店舗名', '在庫'],
        body: data.map((x) => [x.str_name, x.zaiko])
      });
    } catch (error) {
      console.error('在庫情報の取得に失敗しました:', error);
      form.setFieldValue('result', {
        head: ['エラー'],
        body: [['在庫情報の取得に失敗しました。JANコードを確認してください。']]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (): void => {
    form.reset();
    form.setFieldValue('result', { head: [], body: [] });
    form.clearErrors();
  };

  return (
    <Box
      maw={400}
      mx='auto'
      component='form'
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      style={{ position: 'relative' }}
    >
      <LoadingOverlay visible={loading} overlayProps={{ radius: 'sm', blur: 2 }} />
      <TextInput
        label='JANコード'
        placeholder='バーコード下の13桁の数字'
        {...form.getInputProps('jan')}
        disabled={loading} // ローディング中は無効化
      />
      <Group justify='flex-end' mt='md'>
        <Button type='submit' disabled={loading}>
          送信
        </Button>
        <Button color='gray' type='button' onClick={handleReset} disabled={loading}>
          クリア
        </Button>
      </Group>

      {/* 結果が空でない場合のみテーブルを表示 */}
      {form.values.result?.body && form.values.result.body.length > 0 && (
        <Table striped data={form.values.result} mt='md' />
      )}
    </Box>
  );
}

export default function Page() {
  const form = useForm({
    initialValues: {
      jan: '',
      result: { head: [], body: [] }
    }
  });

  return (
    <FormProvider form={form}>
      <Suspense
        fallback={
          <Box maw={400} mx='auto'>
            <LoadingOverlay visible overlayProps={{ radius: 'sm', blur: 2 }} />
          </Box>
        }
      >
        <DaisoFormContent />
      </Suspense>
    </FormProvider>
  );
}
