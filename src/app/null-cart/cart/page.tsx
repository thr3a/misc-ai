'use client';

import { Anchor, Badge, Box, Button, Container, Divider, Grid, Group, NumberInput, Stack, Text } from '@mantine/core';
import { IconShoppingCart, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CatalogEmptyState } from '../components/CatalogEmptyState';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { useCart } from '../hooks/useCart';
import { useGeneratedItems } from '../hooks/useGeneratedItems';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, totalItems, isReady: isCartReady } = useCart();
  const router = useRouter();
  const { items, isReady: isItemsReady, hasItems } = useGeneratedItems();

  const getItemById = (productId: string) => items.find((item) => String(item.id) === productId);

  const totalPrice = cartItems.reduce((sum, cartItem) => {
    const item = getItemById(cartItem.productId);
    return sum + (item?.discountedPrice ?? 0) * cartItem.quantity;
  }, 0);

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
        <Container size='xl' py='xl' style={{ flex: 1 }}>
          <Text ta='center' c='dimmed'>
            カート情報を読み込み中...
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
        <Container size='xl' py='xl' style={{ flex: 1 }}>
          <CatalogEmptyState
            title='商品データがありません'
            description='カートを使う前に、購入したいジャンルから商品を生成してください。'
          />
        </Container>
        <Footer />
      </Box>
    );
  }

  if (cartItems.length === 0) {
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
        <Container size='xl' py='xl' style={{ flex: 1 }}>
          <Box
            style={{
              backgroundColor: 'white',
              padding: 40,
              borderRadius: 4,
              textAlign: 'center'
            }}
          >
            <IconShoppingCart size={64} color='#ccc' />
            <Text size='xl' fw='bold' mt='md'>
              カートは空です
            </Text>
            <Text c='#565959' mt='sm'>
              カートに商品がありません。
            </Text>
            <Button component={Link} href='/null-cart' mt='md' style={{ backgroundColor: '#FFD814', color: '#0F1111' }}>
              ショッピングを続ける
            </Button>
          </Box>
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
      <Container size={1360} py='md' style={{ flex: 1, width: '100%' }}>
        <Grid>
          {/* カートアイテム一覧 */}
          <Grid.Col span={{ base: 12, md: 9 }}>
            <Box style={{ backgroundColor: 'white', padding: 24, borderRadius: 4 }}>
              <Text size='xl' fw='bold' mb='md'>
                ショッピングカート
              </Text>
              <Stack gap='md'>
                {cartItems.map((cartItem) => {
                  const product = getItemById(cartItem.productId);
                  if (!product) return null;
                  return (
                    <Box key={cartItem.productId}>
                      <Group align='flex-start' gap='md'>
                        <Box
                          style={{
                            width: 112,
                            height: 112,
                            backgroundColor: '#FFF3E0',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 40,
                            flexShrink: 0
                          }}
                        >
                          🛒
                        </Box>
                        <Stack gap='sm' style={{ flex: 1, minWidth: 0 }}>
                          <Group justify='space-between' align='flex-start' gap='md' wrap='nowrap'>
                            <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                              <Anchor
                                component={Link}
                                href={`/null-cart/products/${product.id}`}
                                fw='bold'
                                c='#0F1111'
                                td='none'
                              >
                                {product.name}
                              </Anchor>
                              <Badge color='green' variant='light' size='xs' w='fit-content'>
                                在庫あり
                              </Badge>
                            </Stack>
                            <Text visibleFrom='sm' fw='bold' fz='lg' ta='right' style={{ flexShrink: 0 }}>
                              ¥{(product.discountedPrice * cartItem.quantity).toLocaleString()}
                            </Text>
                          </Group>
                          <Group gap={8} align='baseline' wrap='wrap'>
                            <Text size='sm' c='#888' td='line-through'>
                              ¥{product.originalPrice.toLocaleString()}
                            </Text>
                            <Text fw='bold' c='#B12704' fz='xl'>
                              ¥{product.discountedPrice.toLocaleString()}
                            </Text>
                          </Group>
                          <Text hiddenFrom='sm' fw='bold' fz='lg'>
                            小計: ¥{(product.discountedPrice * cartItem.quantity).toLocaleString()}
                          </Text>
                          <Group gap='sm' align='center' wrap='wrap'>
                            <NumberInput
                              value={cartItem.quantity}
                              onChange={(v) =>
                                updateQuantity(cartItem.productId, typeof v === 'number' ? v : Number(v))
                              }
                              min={1}
                              max={99}
                              size='xs'
                              style={{ width: 80 }}
                            />
                            <Button
                              variant='subtle'
                              size='xs'
                              color='red'
                              leftSection={<IconTrash size={14} />}
                              onClick={() => removeFromCart(cartItem.productId)}
                            >
                              削除
                            </Button>
                          </Group>
                        </Stack>
                      </Group>
                      <Divider mt='md' />
                    </Box>
                  );
                })}
              </Stack>
              <Group justify='flex-end' mt='md'>
                <Text size='lg' fw='bold'>
                  小計 ({totalItems}点):{' '}
                  <Text component='span' c='#B12704'>
                    ¥{totalPrice.toLocaleString()}
                  </Text>
                </Text>
              </Group>
            </Box>
          </Grid.Col>

          {/* 注文サマリー */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Box style={{ backgroundColor: 'white', padding: 16, borderRadius: 4 }}>
              <Stack gap='sm'>
                <Text size='md' fw='bold'>
                  小計 ({totalItems}点):{' '}
                  <Text component='span' c='#B12704'>
                    ¥{totalPrice.toLocaleString()}
                  </Text>
                </Text>
                <Button
                  fullWidth
                  onClick={() => router.push('/null-cart/checkout')}
                  style={{ backgroundColor: '#FFD814', color: '#0F1111' }}
                >
                  レジに進む
                </Button>
                <Button
                  fullWidth
                  variant='outline'
                  component={Link}
                  href='/null-cart'
                  style={{ color: '#0F1111', borderColor: '#ccc' }}
                >
                  ショッピングを続ける
                </Button>
              </Stack>
            </Box>
          </Grid.Col>
        </Grid>
      </Container>
      <Footer />
    </Box>
  );
};

export default CartPage;
