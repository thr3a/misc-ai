'use client';

import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  Loader,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon
} from '@mantine/core';
import {
  IconBolt,
  IconChevronRight,
  IconHistory,
  IconRefresh,
  IconShieldCheck,
  IconSparkles,
  IconTruckDelivery
} from '@tabler/icons-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CatalogEmptyState } from './components/CatalogEmptyState';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { LiveViewers } from './components/LiveViewers';
import { ProductVisual } from './components/ProductVisual';
import { SaleCountdown } from './components/SaleCountdown';
import { SocialProofToast } from './components/SocialProofToast';
import { StarRating } from './components/StarRating';
import { useGeneratedItems } from './hooks/useGeneratedItems';
import {
  getCouponLabel,
  getDealClaim,
  getDealProgress,
  getDeliveryLabel,
  getSoldToday,
  getStockLeft,
  isNullChoice
} from './presentation';
import type { Item } from './types';

const discountRate = (item: Item): number => {
  if (item.originalPrice <= 0) {
    return 0;
  }

  return Math.max(Math.round(((item.originalPrice - item.discountedPrice) / item.originalPrice) * 100), 0);
};

const shuffleItems = (items: Item[], seed: number): Item[] => {
  const shuffled = [...items];
  let value = seed;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    value = (value * 1664525 + 1013904223) % 4294967296;
    const targetIndex = Math.floor((value / 4294967296) * (index + 1));
    [shuffled[index], shuffled[targetIndex]] = [shuffled[targetIndex], shuffled[index]];
  }

  return shuffled;
};

type PriceProps = {
  value: number;
  size?: 'sm' | 'lg';
};

const Price = ({ value, size = 'sm' }: PriceProps) => (
  <Group gap={2} align='flex-start' wrap='nowrap'>
    <Text fz={size === 'lg' ? 16 : 12} mt={size === 'lg' ? 3 : 2} c='#0f1111'>
      ¥
    </Text>
    <Text fz={size === 'lg' ? 32 : 24} fw='bold' lh={1} c='#0f1111'>
      {value.toLocaleString()}
    </Text>
  </Group>
);

type DealCardProps = {
  item: Item;
};

const DealCard = ({ item }: DealCardProps) => {
  const rate = discountRate(item);
  const progress = getDealProgress(item);
  const coupon = getCouponLabel(item);

  return (
    <Card
      component={Link}
      href={`/null-cart/products/${item.id}`}
      p={0}
      bd='1px solid #e3e6e6'
      className='nc-product-card'
      bg='white'
      c='#0f1111'
      style={{ textDecoration: 'none', overflow: 'hidden' }}
    >
      <Box pos='relative'>
        <ProductVisual item={item} />
        <Badge pos='absolute' top='sm' left='sm' color='red.8' size='lg'>
          {rate}% OFF
        </Badge>
        {isNullChoice(item) && (
          <Box pos='absolute' bottom={0} left={0} bg='#232f3e' px='xs' py={4}>
            <Text c='white' fz={11} fw='bold'>
              Null&apos;s{' '}
              <Text component='span' c='#ff9900'>
                おすすめ
              </Text>
            </Text>
          </Box>
        )}
      </Box>

      <Stack gap={7} p='md' style={{ flex: 1 }}>
        <Text lineClamp={2} size='sm' lh={1.35} mih={38}>
          {item.name}
        </Text>
        <StarRating rating={item.rating} count={item.reviewCount} compact />

        <Group gap='xs' align='center'>
          <Badge color='red.8' size='md'>
            タイムセール
          </Badge>
          <Text c='#cc0c39' fw='bold' size='sm'>
            -{rate}%
          </Text>
        </Group>

        <Price value={item.discountedPrice} />
        <Text fz={11} c='#565959'>
          参考価格:{' '}
          <Text component='span' td='line-through'>
            ¥{item.originalPrice.toLocaleString()}
          </Text>
        </Text>

        {coupon && (
          <Group gap='xs' wrap='nowrap'>
            <Badge color='lime.4' c='#0f1111' size='sm'>
              クーポン
            </Badge>
            <Text fz={11} lineClamp={1}>
              {coupon}
            </Text>
          </Group>
        )}

        <Box mt='auto'>
          <Group justify='space-between' gap='xs' mb={4}>
            <Text fz={11} c='#cc0c39' fw='bold'>
              {progress}%カート追加済み
            </Text>
            <Text fz={11} c='#565959'>
              残り{getStockLeft(item)}点
            </Text>
          </Group>
          <Progress value={progress} color='#e77600' size={5} mb='xs' />
          <Text fz={11} c='#007600' fw='bold'>
            null prime
          </Text>
          <Text fz={11} c='#0f1111' fw='bold' lineClamp={1}>
            {getDeliveryLabel(item)}
          </Text>
        </Box>
      </Stack>
    </Card>
  );
};

const TopPage = () => {
  const { items, isReady, hasItems } = useGeneratedItems();
  const [shuffleSeed, setShuffleSeed] = useState(() => Date.now());
  const shuffledItems = useMemo(() => shuffleItems(items, shuffleSeed), [items, shuffleSeed]);
  const featuredItem = shuffledItems[0];

  return (
    <Box bg='#eaeded' mih='100vh' style={{ display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .nc-product-card { transition: transform 160ms ease, box-shadow 160ms ease; }
        .nc-product-card:hover { transform: translateY(-3px); box-shadow: 0 8px 22px rgba(15, 17, 17, 0.18); }
        .nc-category-card { transition: box-shadow 160ms ease; }
        .nc-category-card:hover { box-shadow: 0 5px 18px rgba(15, 17, 17, 0.16); }
        @keyframes ncHeroGlow {
          0%, 100% { opacity: .5; transform: scale(1); }
          50% { opacity: .85; transform: scale(1.08); }
        }
      `}</style>

      <Header />

      <Box
        pos='relative'
        pb={84}
        style={{
          overflow: 'hidden',
          background: 'linear-gradient(118deg, #061c2b 0%, #123a54 48%, #08637a 100%)'
        }}
      >
        <Box
          pos='absolute'
          top={-120}
          right='4%'
          w={430}
          h={430}
          opacity={0.55}
          style={{
            border: '80px solid rgba(0, 218, 198, 0.18)',
            borderRadius: '50%',
            animation: 'ncHeroGlow 5s ease-in-out infinite'
          }}
        />
        <Container size='xl' py={44} pos='relative'>
          <Grid align='center' gutter='xl'>
            <Grid.Col span={{ base: 12, md: featuredItem ? 7 : 12 }}>
              <Stack gap='md' maw={720}>
                <Group gap='xs'>
                  <Badge color='cyan.4' c='#04202a' size='lg' leftSection={<IconBolt size={14} />}>
                    NULL DEAL DAYS
                  </Badge>
                  <Text c='cyan.1' size='sm'>
                    架空なのに、満足感は本気。
                  </Text>
                </Group>
                <Text c='white' fw='bold' fz={{ base: 34, sm: 48 }} lh={1.08} lts={-1.6}>
                  欲しかったもの、
                  <br />
                  今日ぜんぶ買ったことに。
                </Text>
                <Text c='gray.2' size='md' maw={630} lh={1.65}>
                  注目商品が最大67%OFF。決済も配送もすべて架空だから、気になる商品を好きなだけカートへ。
                </Text>
                <Group gap='lg'>
                  <SaleCountdown label='本日のセール終了まで' labelColor='#ffd814' />
                  <LiveViewers baseCount={184} label='がセールを閲覧中' color='white' />
                </Group>
                <Group gap='sm'>
                  <Button
                    component={Link}
                    href='#deals'
                    size='md'
                    bg='#ffd814'
                    c='#0f1111'
                    rightSection={<IconChevronRight size={17} />}
                  >
                    今日の特価を見る
                  </Button>
                  <Button
                    component={Link}
                    href='/null-cart/generate'
                    size='md'
                    variant='outline'
                    c='white'
                    color='white'
                    leftSection={<IconSparkles size={17} />}
                  >
                    欲しい商品をつくる
                  </Button>
                </Group>
              </Stack>
            </Grid.Col>

            {featuredItem && (
              <Grid.Col span={{ base: 12, md: 5 }} visibleFrom='md'>
                <Box bg='white' p='sm' style={{ boxShadow: '0 18px 50px rgba(0, 0, 0, 0.34)' }}>
                  <Grid gutter='sm' align='center'>
                    <Grid.Col span={5}>
                      <ProductVisual item={featuredItem} compact />
                    </Grid.Col>
                    <Grid.Col span={7}>
                      <Stack gap={6}>
                        <Badge color='red.8' size='sm' style={{ alignSelf: 'flex-start' }}>
                          まもなく終了
                        </Badge>
                        <Text fw='bold' lineClamp={2} size='sm'>
                          {featuredItem.name}
                        </Text>
                        <StarRating rating={featuredItem.rating} count={featuredItem.reviewCount} compact />
                        <Group gap='xs' align='center'>
                          <Text c='#cc0c39' fw='bold' size='lg'>
                            -{discountRate(featuredItem)}%
                          </Text>
                          <Price value={featuredItem.discountedPrice} />
                        </Group>
                        <Text fz={11} c='#cc0c39' fw='bold'>
                          本日{getSoldToday(featuredItem)}点売れました
                        </Text>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Box>
              </Grid.Col>
            )}
          </Grid>
        </Container>
      </Box>

      <Container size='xl' mt={-58} pb='xl' pos='relative' style={{ flex: 1 }}>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing='md' mb='lg'>
          <Box bg='white' p='lg' className='nc-category-card'>
            <Stack gap='md'>
              <Text size='lg' fw='bold'>
                今日だけのご褒美
              </Text>
              <Group gap='md' wrap='nowrap'>
                <ThemeIcon size={52} color='orange.1' c='orange.8'>
                  <IconBolt size={27} />
                </ThemeIcon>
                <Stack gap={2}>
                  <Text fw='bold'>最大67% OFF</Text>
                  <Text size='xs' c='dimmed'>
                    選ばれた商品の限定価格
                  </Text>
                </Stack>
              </Group>
              <Text component='a' href='#deals' size='sm' c='#007185'>
                タイムセールをすべて見る
              </Text>
            </Stack>
          </Box>
          <Box bg='white' p='lg' className='nc-category-card'>
            <Stack gap='md'>
              <Text size='lg' fw='bold'>
                迷ったら、もう一度
              </Text>
              <Group gap='md' wrap='nowrap'>
                <ThemeIcon size={52} color='blue.1' c='blue.8'>
                  <IconHistory size={27} />
                </ThemeIcon>
                <Stack gap={2}>
                  <Text fw='bold'>おすすめを再抽選</Text>
                  <Text size='xs' c='dimmed'>
                    次の欲しいものに出会えます
                  </Text>
                </Stack>
              </Group>
              <Button
                variant='subtle'
                color='cyan.9'
                p={0}
                h='auto'
                justify='flex-start'
                onClick={() => setShuffleSeed(Date.now())}
              >
                商品をシャッフルする
              </Button>
            </Stack>
          </Box>
          <Box bg='white' p='lg' className='nc-category-card'>
            <Stack gap='md'>
              <Text size='lg' fw='bold'>
                すぐ届く気分だけ
              </Text>
              <Group gap='md' wrap='nowrap'>
                <ThemeIcon size={52} color='teal.1' c='teal.8'>
                  <IconTruckDelivery size={27} />
                </ThemeIcon>
                <Stack gap={2}>
                  <Text fw='bold'>最短2時間配送</Text>
                  <Text size='xs' c='dimmed'>
                    もちろん実際には届きません
                  </Text>
                </Stack>
              </Group>
              <Text size='sm' c='#007185'>
                null prime 配送料無料
              </Text>
            </Stack>
          </Box>
          <Box bg='white' p='lg' className='nc-category-card'>
            <Stack gap='md'>
              <Text size='lg' fw='bold'>
                お支払いは完全に0円
              </Text>
              <Group gap='md' wrap='nowrap'>
                <ThemeIcon size={52} color='green.1' c='green.8'>
                  <IconShieldCheck size={27} />
                </ThemeIcon>
                <Stack gap={2}>
                  <Text fw='bold'>安全な架空決済</Text>
                  <Text size='xs' c='dimmed'>
                    請求も発送も発生しません
                  </Text>
                </Stack>
              </Group>
              <Text component={Link} href='/null-cart/generate' size='sm' c='#007185'>
                新しい商品棚をつくる
              </Text>
            </Stack>
          </Box>
        </SimpleGrid>

        <Box id='deals' bg='white' p={{ base: 'md', sm: 'lg' }} mb='lg'>
          <Group justify='space-between' align='flex-end' mb='md'>
            <Stack gap={2}>
              <Group gap='xs'>
                <Text fz={25} fw='bold' lts={-0.5}>
                  あなたへのタイムセール
                </Text>
                <Badge color='red.8' size='sm'>
                  LIVE
                </Badge>
              </Group>
              <Text size='sm' c='#565959'>
                閲覧するたびに順番が変わる、いまだけのおすすめ
              </Text>
            </Stack>
            <Button
              visibleFrom='sm'
              variant='subtle'
              color='cyan.9'
              leftSection={<IconRefresh size={16} />}
              onClick={() => setShuffleSeed(Date.now())}
            >
              おすすめを更新
            </Button>
          </Group>

          {!isReady && (
            <Stack align='center' py={60}>
              <Loader color='orange' size='lg' />
              <Text c='dimmed'>あなた専用のセール会場を準備中...</Text>
            </Stack>
          )}

          {isReady && !hasItems && (
            <CatalogEmptyState
              title='あなた専用の商品棚をつくりましょう'
              description='いま欲しいものを入力すると、買いたくなる架空の商品を5件まとめてご用意します。'
            />
          )}

          {hasItems && (
            <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 5 }} spacing='sm'>
              {shuffledItems.map((item) => (
                <DealCard key={item.id} item={item} />
              ))}
            </SimpleGrid>
          )}
        </Box>

        {hasItems && (
          <Box bg='white' p={{ base: 'md', sm: 'lg' }}>
            <Group justify='space-between' mb='md'>
              <Stack gap={2}>
                <Text size='xl' fw='bold'>
                  いま、みんなが見ている商品
                </Text>
                <Text size='sm' c='dimmed'>
                  {getDealClaim(featuredItem)}
                </Text>
              </Stack>
              <LiveViewers baseCount={92} label='がこの棚をチェック中' />
            </Group>
            <Divider mb='md' />
            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing='md'>
              {[...shuffledItems].reverse().map((item) => (
                <Box
                  component={Link}
                  href={`/null-cart/products/${item.id}`}
                  key={item.id}
                  c='#0f1111'
                  style={{ textDecoration: 'none' }}
                >
                  <ProductVisual item={item} compact />
                  <Text size='sm' lineClamp={1} mt='xs'>
                    {item.name}
                  </Text>
                  <Text size='xs' c='#cc0c39' fw='bold'>
                    本日{getSoldToday(item)}点購入
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Container>

      <SocialProofToast items={items} />
      <Footer />
    </Box>
  );
};

export default TopPage;
