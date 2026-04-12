'use client';

import { Badge, Box, Button, Card, Container, Loader, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconFlame } from '@tabler/icons-react';
import Link from 'next/link';
import { CatalogEmptyState } from './components/CatalogEmptyState';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { StarRating } from './components/StarRating';
import { useGeneratedItems } from './hooks/useGeneratedItems';
import type { Item } from './types';

const TopPage = () => {
  const { items, isReady, hasItems } = useGeneratedItems();

  const discountRate = (item: Item) =>
    Math.round(((item.originalPrice - item.discountedPrice) / item.originalPrice) * 100);

  return (
    <Box style={{ backgroundColor: '#EAEDED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* セールヒーローバナー */}
      <Box
        style={{
          background: 'linear-gradient(135deg, #B12704 0%, #E31837 50%, #FF4500 100%)',
          padding: '40px 0',
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)'
          }}
        />
        <Container size='xl' style={{ position: 'relative' }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <IconFlame size={28} color='#FFD814' />
            <Badge size='xl' color='yellow' variant='filled' style={{ fontSize: 14 }} fw='bold'>
              緊急SALE開催中
            </Badge>
            <IconFlame size={28} color='#FFD814' />
          </Box>
          <Text size='xl' fw='bold' c='white' fz={32} style={{ lineHeight: 1.2 }}>
            本日限り！最大
            <Text component='span' c='#FFD814' fz={48}>
              67%
            </Text>
            OFF
          </Text>
          <Text size='md' c='#ffcccc' mt={8}>
            数量限定・売り切れ次第終了！今すぐチェック
          </Text>
          <Box style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href='/null-cart/generate'
              style={{ backgroundColor: '#FFD814', color: '#0F1111' }}
            >
              AIで商品を作る
            </Button>
            <Badge color='yellow' variant='filled' size='lg'>
              タイムセール実施中
            </Badge>
            <Badge color='orange' variant='filled' size='lg'>
              送料無料
            </Badge>
            <Badge color='pink' variant='filled' size='lg'>
              ポイント10倍
            </Badge>
          </Box>
        </Container>
      </Box>

      <Container size='xl' pb='xl' style={{ flex: 1 }}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <IconFlame size={22} color='#E31837' />
          <Text size='xl' fw='bold' c='#E31837'>
            セール対象商品
          </Text>
          <Badge color='red' variant='filled' size='sm' ml={4}>
            SALE
          </Badge>
        </Box>

        {!isReady && (
          <Box style={{ textAlign: 'center', padding: 60 }}>
            <Loader color='orange' size='lg' />
            <Text mt='md' c='dimmed'>
              商品を読み込み中...
            </Text>
          </Box>
        )}

        {isReady && !hasItems && (
          <CatalogEmptyState
            title='まだ商品が生成されていません'
            description='購入したいもののジャンルを入力して、null-cart 用の商品を5件まとめて作れます。'
          />
        )}

        {hasItems && (
          <SimpleGrid cols={{ base: 1, sm: 5 }} spacing='md'>
            {items.map((item) => {
              const rate = discountRate(item);
              return (
                <Card
                  key={item.id}
                  component={Link}
                  href={`/null-cart/products/${item.id}`}
                  shadow='sm'
                  style={{ backgroundColor: 'white', textDecoration: 'none', color: 'inherit', position: 'relative' }}
                >
                  {/* 割引率バッジ */}
                  <Box
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      backgroundColor: '#E31837',
                      color: 'white',
                      fontWeight: 900,
                      fontSize: 13,
                      padding: '2px 8px',
                      borderRadius: 4,
                      zIndex: 1
                    }}
                  >
                    -{rate}%
                  </Box>

                  <Card.Section>
                    <Box
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        backgroundColor: '#FFF3E0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 48
                      }}
                    >
                      🛒
                    </Box>
                  </Card.Section>

                  <Stack gap={4} mt='sm'>
                    <Text size='sm' lineClamp={2}>
                      {item.name}
                    </Text>
                    <StarRating rating={item.rating} count={item.reviewCount} />
                    <Box>
                      <Text size='xs' c='#888' td='line-through'>
                        ¥{item.originalPrice.toLocaleString()}
                      </Text>
                      <Text fw='bold' c='#B12704' fz={20}>
                        ¥{item.discountedPrice.toLocaleString()}
                      </Text>
                    </Box>
                    <Badge color='red' variant='filled' size='xs' style={{ width: 'fit-content' }}>
                      残りわずか！
                    </Badge>
                    <Button size='xs' style={{ backgroundColor: '#FFD814', color: '#0F1111' }} fw='bold' mt={4}>
                      今すぐ購入
                    </Button>
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

export default TopPage;
