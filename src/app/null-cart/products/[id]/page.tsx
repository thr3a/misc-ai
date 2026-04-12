'use client';

import { Carousel } from '@mantine/carousel';
import {
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Center,
  Container,
  Divider,
  Drawer,
  Grid,
  Group,
  List,
  Loader,
  Select,
  Stack,
  Text,
  ThemeIcon
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCheck, IconFlame, IconLock, IconShoppingCart } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { CatalogEmptyState } from '../../components/CatalogEmptyState';
import { Footer } from '../../components/Footer';
import { Header } from '../../components/Header';
import { StarRating } from '../../components/StarRating';
import { useCart } from '../../hooks/useCart';
import { useGeneratedItems } from '../../hooks/useGeneratedItems';

const ProductDetailPage = () => {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];
  const router = useRouter();
  const { addToCart, totalItems } = useCart();
  const [quantity, setQuantity] = useState<string | null>('1');
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [addedQuantity, setAddedQuantity] = useState(0);
  const { items, isReady, hasItems } = useGeneratedItems();

  const product = items?.find((item) => String(item.id) === id);

  const discountRate = product
    ? Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!product) return;
    const qty = parseInt(quantity ?? '1', 10);
    addToCart(String(product.id), qty);
    setAddedQuantity(qty);
    openDrawer();
  };

  const quantityOptions = Array.from({ length: 10 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}`
  }));

  if (!isReady) {
    return (
      <Box style={{ backgroundColor: '#EAEDED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Container size='xl' py='xl' style={{ flex: 1 }}>
          <Center py={80}>
            <Stack align='center'>
              <Loader color='orange' size='lg' />
              <Text c='dimmed'>商品情報を読み込み中...</Text>
            </Stack>
          </Center>
        </Container>
        <Footer />
      </Box>
    );
  }

  if (!hasItems) {
    return (
      <Box style={{ backgroundColor: '#EAEDED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Container size='xl' py='xl' style={{ flex: 1 }}>
          <CatalogEmptyState
            title='商品データがありません'
            description='商品詳細を見るには、先に null-cart 用の商品を生成してください。'
          />
        </Container>
        <Footer />
      </Box>
    );
  }

  if (!product) {
    return (
      <Box style={{ backgroundColor: '#EAEDED', minHeight: '100vh' }}>
        <Header />
        <Container size='xl' py='xl'>
          <Text>商品が見つかりません。</Text>
          <Anchor component={Link} href='/null-cart'>
            トップページへ戻る
          </Anchor>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <>
      {/* カートに追加したときのバウンスアニメーション定義 */}
      <style>{`
        @keyframes cartAddBounce {
          0%   { transform: scale(0.4); opacity: 0; }
          55%  { transform: scale(1.25); opacity: 1; }
          75%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes checkPop {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* カート追加成功ドロワー */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        position='right'
        size='sm'
        withCloseButton={false}
        padding='lg'
        overlayProps={{ opacity: 0.3 }}
      >
        <Stack gap='md'>
          {/* 成功メッセージ */}
          <Group gap='sm' bg='green.0' p='md' style={{ borderRadius: 8 }}>
            <ThemeIcon color='green' size={44} style={{ borderRadius: '50%', animation: 'checkPop 0.4s ease-out' }}>
              <IconCheck size={24} />
            </ThemeIcon>
            <Stack gap={0}>
              <Text fw='bold' c='green.8' size='lg'>
                カートに追加しました！
              </Text>
              <Text size='xs' c='green.6'>
                お得なお買い物、ありがとうございます
              </Text>
            </Stack>
          </Group>

          {/* 追加した商品情報 */}
          <Box bd='1px solid gray.2' p='sm' style={{ borderRadius: 6 }}>
            <Text size='xs' c='dimmed' mb={4}>
              追加した商品
            </Text>
            <Text fw='bold' size='sm'>
              {product?.name}
            </Text>
            <Group gap='xs' mt={4}>
              <Badge color='orange' variant='light' size='sm'>
                数量 {addedQuantity}個
              </Badge>
              <Text size='sm' fw='bold' c='#B12704'>
                ¥{((product?.discountedPrice ?? 0) * addedQuantity).toLocaleString()}
              </Text>
            </Group>
          </Box>

          {/* カート合計数（バウンスアニメーション） */}
          <Center>
            <Stack align='center' gap={2}>
              <Text size='xs' c='dimmed'>
                カート内の合計点数
              </Text>
              {/* key を totalItems にすることでカート追加のたびにアニメーション再実行 */}
              <Text
                fw='bold'
                c='orange.6'
                fz={56}
                key={totalItems}
                style={{ animation: 'cartAddBounce 0.5s ease-out', lineHeight: 1 }}
              >
                {totalItems}
              </Text>
              <Text size='xs' c='dimmed'>
                点
              </Text>
            </Stack>
          </Center>

          <Divider />

          <Stack gap='xs'>
            <Button
              fullWidth
              size='md'
              fw='bold'
              leftSection={<IconShoppingCart size={18} />}
              style={{ backgroundColor: '#FFD814', color: '#0F1111' }}
              onClick={() => {
                closeDrawer();
                router.push('/null-cart/cart');
              }}
            >
              カートで確認する
            </Button>
            <Button fullWidth variant='subtle' color='gray' size='sm' onClick={closeDrawer}>
              買い物を続ける
            </Button>
          </Stack>
        </Stack>
      </Drawer>

      <Box
        style={{
          backgroundColor: '#EAEDED',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Header />
        <Container size='xl' py='md' style={{ flex: 1 }}>
          {/* パンくずリスト */}
          <Breadcrumbs mb='md' separator='›'>
            <Anchor component={Link} href='/null-cart' size='sm' c='#007185'>
              トップ
            </Anchor>
            <Text size='sm'>{product.name}</Text>
          </Breadcrumbs>

          <Box style={{ backgroundColor: 'white', padding: 24, borderRadius: 4 }}>
            <Grid>
              {/* 商品画像カルーセル */}
              <Grid.Col span={{ base: 12, md: 5 }}>
                <Carousel withIndicators withControls emblaOptions={{ loop: true }} height={360}>
                  <Carousel.Slide>
                    <Center style={{ backgroundColor: '#D6EAF8', height: '100%', borderRadius: 4 }}>
                      <Text size='lg' c='dimmed'>
                        {product.name} - 正面
                      </Text>
                    </Center>
                  </Carousel.Slide>
                  <Carousel.Slide>
                    <Center style={{ backgroundColor: '#D5F5E3', height: '100%', borderRadius: 4 }}>
                      <Text size='lg' c='dimmed'>
                        {product.name} - 側面
                      </Text>
                    </Center>
                  </Carousel.Slide>
                  <Carousel.Slide>
                    <Center style={{ backgroundColor: '#FCF3CF', height: '100%', borderRadius: 4 }}>
                      <Text size='lg' c='dimmed'>
                        {product.name} - 背面
                      </Text>
                    </Center>
                  </Carousel.Slide>
                </Carousel>
              </Grid.Col>

              {/* 商品情報 */}
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Stack gap='sm'>
                  {/* セールバッジ */}
                  <Group gap={6}>
                    <Badge color='red' variant='filled' size='lg' leftSection={<IconFlame size={12} />}>
                      セール -{discountRate}%OFF
                    </Badge>
                    <Badge color='orange' variant='light' size='sm'>
                      タイムセール
                    </Badge>
                  </Group>

                  <Text size='xl' fw='bold'>
                    {product.name}
                  </Text>
                  <StarRating rating={product.rating} count={product.reviewCount} />
                  <Divider />

                  {/* 価格 */}
                  <Box>
                    <Group gap={8} align='baseline' mb={2}>
                      <Text size='sm' c='#565959'>
                        参考価格：
                      </Text>
                      <Text size='sm' c='#888' td='line-through'>
                        ¥{product.originalPrice.toLocaleString()}
                      </Text>
                    </Group>
                    <Group gap={8} align='baseline'>
                      <Text size='sm' c='#B12704'>
                        セール価格：
                      </Text>
                      <Text fw='bold' c='#B12704' fz={32}>
                        ¥{product.discountedPrice.toLocaleString()}
                      </Text>
                    </Group>
                    <Text size='xs' c='#565959'>
                      税込
                    </Text>
                    <Badge color='red' variant='filled' size='sm' mt={4}>
                      {discountRate}%OFF　¥{(product.originalPrice - product.discountedPrice).toLocaleString()}お得！
                    </Badge>
                  </Box>

                  <Divider />
                  <Text size='sm' fw='bold'>
                    商品説明
                  </Text>
                  <Text size='sm'>{product.description}</Text>
                  <Text size='sm' fw='bold'>
                    主な特徴
                  </Text>
                  <List size='sm' spacing={4}>
                    {product.features.map((f) => (
                      <List.Item key={f}>{f}</List.Item>
                    ))}
                  </List>
                </Stack>
              </Grid.Col>

              {/* 購入ボックス */}
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Box
                  style={{
                    border: '2px solid #E31837',
                    borderRadius: 8,
                    padding: 16
                  }}
                >
                  <Stack gap='sm'>
                    <Badge color='red' variant='filled' size='sm' leftSection={<IconFlame size={12} />}>
                      セール実施中
                    </Badge>
                    <Box>
                      <Text size='xs' c='#888' td='line-through'>
                        ¥{product.originalPrice.toLocaleString()}
                      </Text>
                      <Text fw='bold' c='#B12704' fz={28}>
                        ¥{product.discountedPrice.toLocaleString()}
                      </Text>
                      <Text size='xs' c='#565959'>
                        税込
                      </Text>
                    </Box>
                    <Text size='sm' fw='bold' c='#007600'>
                      在庫あり（残りわずか）
                    </Text>
                    <Badge color='blue' variant='light' size='sm'>
                      明日 お届け可能
                    </Badge>
                    <Text size='xs' c='#565959'>
                      配送先: 東京都千代田区
                    </Text>
                    <Select label='数量' data={quantityOptions} value={quantity} onChange={setQuantity} size='sm' />
                    <Button
                      fullWidth
                      onClick={handleAddToCart}
                      leftSection={<IconShoppingCart size={16} />}
                      style={{ backgroundColor: '#FFD814', color: '#0F1111' }}
                      fw='bold'
                    >
                      カートに追加
                    </Button>
                    <Group gap={4} justify='center'>
                      <IconLock size={14} color='#565959' />
                      <Text size='xs' c='#565959'>
                        安全な接続
                      </Text>
                    </Group>
                  </Stack>
                </Box>
              </Grid.Col>
            </Grid>
          </Box>
        </Container>
        <Footer />
      </Box>
    </>
  );
};

export default ProductDetailPage;
