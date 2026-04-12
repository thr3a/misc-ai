'use client';

import { Badge, Box, Button, Container, Divider, Grid, Group, Radio, Stack, Text, TextInput } from '@mantine/core';
import { IconCreditCard, IconLock } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CatalogEmptyState } from '../components/CatalogEmptyState';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { useCart } from '../hooks/useCart';
import { useGeneratedItems } from '../hooks/useGeneratedItems';
import { useLastOrder } from '../hooks/useLastOrder';

const CheckoutPage = () => {
  const router = useRouter();
  const { cartItems, clearCart, isReady: isCartReady, totalItems } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const { items, isReady: isItemsReady, hasItems } = useGeneratedItems();
  const { setLastOrder } = useLastOrder();

  const getItemById = (productId: string) => items.find((item) => String(item.id) === productId);

  const totalPrice = cartItems.reduce((sum, cartItem) => {
    const item = getItemById(cartItem.productId);
    return sum + (item?.discountedPrice ?? 0) * cartItem.quantity;
  }, 0);

  const handleOrder = () => {
    setLastOrder({
      totalPrice,
      totalItems
    });
    clearCart();
    router.push('/null-cart/thank-you');
  };

  if (!isCartReady || !isItemsReady) {
    return (
      <Box
        style={{
          backgroundColor: '#EAEDED',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Header />
        <Container size='lg' py='md' style={{ flex: 1 }}>
          <Text ta='center' c='dimmed'>
            注文情報を読み込み中...
          </Text>
        </Container>
        <Footer />
      </Box>
    );
  }

  if (!hasItems) {
    return (
      <Box
        style={{
          backgroundColor: '#EAEDED',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Header />
        <Container size='lg' py='md' style={{ flex: 1 }}>
          <CatalogEmptyState
            title='商品データがありません'
            description='注文画面に進む前に、null-cart の商品を生成してください。'
          />
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box
      style={{
        backgroundColor: '#EAEDED',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Header />
      <Container size='lg' py='md' style={{ flex: 1 }}>
        <Group gap={8} mb='md'>
          <IconLock size={20} />
          <Text size='xl' fw='bold'>
            安全なお支払い（架空）
          </Text>
        </Group>

        <Grid>
          {/* 左カラム：フォーム */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap='md'>
              {/* お届け先住所 */}
              <Box style={{ backgroundColor: 'white', padding: 24, borderRadius: 4 }}>
                <Text size='lg' fw='bold' mb='md'>
                  お届け先住所
                </Text>
                <Badge color='orange' variant='light' size='sm' mb='md'>
                  ダミーの住所（架空）
                </Badge>
                <Stack gap='sm'>
                  <Group>
                    <TextInput label='姓' defaultValue='山田' style={{ flex: 1 }} />
                    <TextInput label='名' defaultValue='太郎' style={{ flex: 1 }} />
                  </Group>
                  <TextInput label='郵便番号' defaultValue='100-8111' />
                  <TextInput label='都道府県' defaultValue='東京都' />
                  <TextInput label='市区町村・番地' defaultValue='千代田区千代田1-1' />
                  <TextInput label='建物名' defaultValue='皇居' />
                  <TextInput label='電話番号' defaultValue='03-1234-5678' />
                </Stack>
              </Box>

              {/* お支払い方法 */}
              <Box style={{ backgroundColor: 'white', padding: 24, borderRadius: 4 }}>
                <Text size='lg' fw='bold' mb='md'>
                  お支払い方法
                </Text>
                <Radio.Group value={paymentMethod} onChange={setPaymentMethod}>
                  <Stack gap='sm'>
                    <Radio value='credit' label='クレジットカード（架空）' />
                    <Radio value='amazon_pay' label='Amazon Pay（架空）' />
                    <Radio value='convenience' label='コンビニ払い（架空）' />
                  </Stack>
                </Radio.Group>

                {paymentMethod === 'credit' && (
                  <Stack gap='sm' mt='md'>
                    <TextInput
                      label='カード番号'
                      placeholder='1234 5678 9012 3456'
                      leftSection={<IconCreditCard size={16} />}
                    />
                    <Group>
                      <TextInput label='有効期限' placeholder='MM/YY' style={{ flex: 1 }} />
                      <TextInput label='セキュリティコード' placeholder='123' style={{ flex: 1 }} />
                    </Group>
                    <TextInput label='カード名義' placeholder='YAMADA TARO' />
                  </Stack>
                )}
              </Box>
            </Stack>
          </Grid.Col>

          {/* 右カラム：注文サマリー */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Box style={{ backgroundColor: 'white', padding: 16, borderRadius: 4 }}>
              <Stack gap='sm'>
                <Text size='lg' fw='bold'>
                  注文内容
                </Text>
                <Divider />
                {cartItems.map((cartItem) => {
                  const product = getItemById(cartItem.productId);
                  if (!product) return null;
                  return (
                    <Group key={cartItem.productId} justify='space-between' align='flex-start'>
                      <Text size='sm' style={{ flex: 1 }}>
                        {product.name} × {cartItem.quantity}
                      </Text>
                      <Text size='sm' fw='bold' style={{ flexShrink: 0 }}>
                        ¥{(product.discountedPrice * cartItem.quantity).toLocaleString()}
                      </Text>
                    </Group>
                  );
                })}
                <Divider />
                <Group justify='space-between'>
                  <Text>小計</Text>
                  <Text>¥{totalPrice.toLocaleString()}</Text>
                </Group>
                <Group justify='space-between'>
                  <Text>配送料</Text>
                  <Text c='#007600'>無料</Text>
                </Group>
                <Divider />
                <Group justify='space-between'>
                  <Text fw='bold' size='lg'>
                    合計
                  </Text>
                  <Text fw='bold' size='lg' c='#B12704'>
                    ¥{totalPrice.toLocaleString()}
                  </Text>
                </Group>
                <Box
                  style={{
                    backgroundColor: '#FFF8E1',
                    border: '1px solid #FF9900',
                    borderRadius: 4,
                    padding: '6px 10px',
                    textAlign: 'center'
                  }}
                >
                  <Text size='xs' c='#7A5800'>
                    架空の注文 - お金はかかりません
                  </Text>
                </Box>
                <Button
                  fullWidth
                  onClick={handleOrder}
                  style={{ backgroundColor: '#FFD814', color: '#0F1111' }}
                  size='lg'
                >
                  注文を確定する
                </Button>
                <Group gap={4} justify='center'>
                  <IconLock size={14} color='#565959' />
                  <Text size='xs' c='#565959'>
                    安全な接続（架空）
                  </Text>
                </Group>
              </Stack>
            </Box>
          </Grid.Col>
        </Grid>
      </Container>
      <Footer />
    </Box>
  );
};

export default CheckoutPage;
