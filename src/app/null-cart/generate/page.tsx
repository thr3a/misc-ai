'use client';

import { Alert, Box, Button, Container, Radio, Stack, Text, Textarea } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { useCart } from '../hooks/useCart';
import { useGeneratedItems } from '../hooks/useGeneratedItems';
import { NullCartItemsResponseSchema, type NullCartTaste, NullCartTasteSchema } from '../types';

const GeneratePage = () => {
  const router = useRouter();
  const { setItems, hasItems } = useGeneratedItems();
  const { clearCart } = useCart();
  const [prompt, setPrompt] = useState('');
  const [taste, setTaste] = useState<NullCartTaste>('real');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTasteChange = (value: string) => {
    const parsedTaste = NullCartTasteSchema.safeParse(value);

    if (!parsedTaste.success) {
      return;
    }

    setTaste(parsedTaste.data);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('購入したいアイテムやジャンルを入力してください。');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/null-cart/items/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          taste
        })
      });

      if (!response.ok) {
        throw new Error('商品の生成に失敗しました。');
      }

      const data = NullCartItemsResponseSchema.parse(await response.json());
      setItems(data.items);
      clearCart();
      router.push('/null-cart');
    } catch (_error) {
      setError('商品の生成に失敗しました。少し待ってから再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box bg='#EAEDED' mih='100vh' style={{ display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Container size='sm' py='xl' style={{ flex: 1 }}>
        <Box bg='white' p='xl'>
          <Stack gap='lg'>
            <Stack gap='xs'>
              <Text size='xl' fw='bold'>
                null-cart 商品生成
              </Text>
              <Text c='dimmed'>購入意欲を発散したいジャンルを入れると、架空のEC商品を5件まとめて作成します。</Text>
            </Stack>

            {hasItems && (
              <Alert color='yellow' title='現在の商品を上書きします'>
                新しく生成した商品を保存すると、今のカート内容はクリアされます。
              </Alert>
            )}

            <Textarea
              label='あなたが購入したいアイテムやジャンル(購入意欲を発散したいもの)'
              placeholder='GPUサーバー、ギター、マンション、電化製品'
              value={prompt}
              onChange={(event) => setPrompt(event.currentTarget.value)}
              minRows={3}
              autosize
            />

            <Radio.Group label='テイスト' value={taste} onChange={handleTasteChange}>
              <Stack gap='sm'>
                <Radio value='real' label='リアル系' />
                <Radio value='joke' label='ネタ系' />
              </Stack>
            </Radio.Group>

            {error && <Alert color='red'>{error}</Alert>}

            <Button
              onClick={handleGenerate}
              loading={loading}
              leftSection={<IconSparkles size={18} />}
              style={{ backgroundColor: '#FFD814', color: '#0F1111' }}
            >
              5件生成してショップへ移動
            </Button>
          </Stack>
        </Box>
      </Container>
      <Footer />
    </Box>
  );
};

export default GeneratePage;
