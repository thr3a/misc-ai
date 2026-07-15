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

type CreditCard = {
  id: string;
  name: string;
  tier: string;
  tierColor: string;
  maskedNumber: string;
  holder: string;
  expiry: string;
};

// 架空の登録済みクレジットカード一覧
const creditCards: CreditCard[] = [
  {
    id: 'centurion',
    name: 'アメリカン・エキスプレス センチュリオン・カード',
    tier: 'ブラック',
    tierColor: 'dark',
    maskedNumber: '**** ****** *0001',
    holder: 'TARO YAMADA',
    expiry: '12/39'
  },
  {
    id: 'jcb-the-class',
    name: 'JCB ザ・クラス',
    tier: 'ブラック',
    tierColor: 'dark',
    maskedNumber: '**** **** **** 3540',
    holder: 'TARO YAMADA',
    expiry: '08/38'
  },
  {
    id: 'diners-premium',
    name: 'ダイナースクラブ プレミアムカード',
    tier: 'プレミアム',
    tierColor: 'indigo',
    maskedNumber: '**** ****** 0036',
    holder: 'TARO YAMADA',
    expiry: '03/37'
  },
  {
    id: 'luxury-gold',
    name: 'ラグジュアリーカード Mastercard Gold Card',
    tier: 'ゴールド',
    tierColor: 'yellow',
    maskedNumber: '**** **** **** 5412',
    holder: 'TARO YAMADA',
    expiry: '10/40'
  }
];

const CheckoutPage = () => {
  const router = useRouter();
  const { cartItems, clearCart, isReady: isCartReady, totalItems } = useCart();
  const [selectedCardId, setSelectedCardId] = useState(creditCards[0].id);
  const { items, isReady: isItemsReady, hasItems } = useGeneratedItems();
  const { setLastOrder } = useLastOrder();

  const getItemById = (productId: string) => items.find((item) => String(item.id) === productId);

  const totalPrice = cartItems.reduce((sum, cartItem) => {
    const item = getItemById(cartItem.productId);
    return sum + (item?.discountedPrice ?? 0) * cartItem.quantity;
  }, 0);

  const totalSavings = cartItems.reduce((sum, cartItem) => {
    const item = getItemById(cartItem.productId);
    if (!item) return sum;
    return sum + (item.originalPrice - item.discountedPrice) * cartItem.quantity;
  }, 0);

  const handleOrder = () => {
    setLastOrder({
      totalPrice,
      totalItems,
      totalSavings
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
                  お届け先住所（架空）
                </Text>
                <Stack gap='sm'>
                  <Group>
                    <TextInput label='姓' defaultValue='山田' disabled style={{ flex: 1 }} />
                    <TextInput label='名' defaultValue='太郎' disabled style={{ flex: 1 }} />
                  </Group>
                  <TextInput label='郵便番号' defaultValue='100-8111' disabled />
                  <TextInput label='都道府県' defaultValue='東京都' disabled />
                  <TextInput label='市区町村・番地' defaultValue='千代田区千代田1-1' disabled />
                  <TextInput label='建物名' defaultValue='皇居' disabled />
                  <TextInput label='電話番号' defaultValue='03-1234-5678' disabled />
                </Stack>
              </Box>

              {/* お支払い方法 */}
              <Box style={{ backgroundColor: 'white', padding: 24, borderRadius: 4 }}>
                <Text size='lg' fw='bold' mb='md'>
                  お支払い方法（架空）
                </Text>
                <Text size='sm' c='dimmed' mb='sm'>
                  登録済みのクレジットカード（架空）からお選びください
                </Text>
                <Radio.Group value={selectedCardId} onChange={setSelectedCardId}>
                  <Stack gap='sm'>
                    {creditCards.map((card) => (
                      <Radio
                        key={card.id}
                        value={card.id}
                        label={
                          <Group gap='xs'>
                            <IconCreditCard size={16} />
                            <Text size='sm' fw='bold'>
                              {card.name}
                            </Text>
                            <Badge color={card.tierColor} size='sm'>
                              {card.tier}
                            </Badge>
                          </Group>
                        }
                        description={`${card.maskedNumber} ／ 有効期限 ${card.expiry} ／ 名義 ${card.holder}`}
                      />
                    ))}
                  </Stack>
                </Radio.Group>
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
                {totalSavings > 0 && (
                  <Group justify='space-between'>
                    <Text c='#B12704' fw='bold'>
                      割引
                    </Text>
                    <Text c='#B12704' fw='bold'>
                      -¥{totalSavings.toLocaleString()}
                    </Text>
                  </Group>
                )}
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
