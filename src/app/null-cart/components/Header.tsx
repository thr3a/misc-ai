'use client';

import { ActionIcon, Box, Container, Group, Select, Text, TextInput, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconMapPin, IconMenu2, IconSearch, IconShoppingCart } from '@tabler/icons-react';
import Link from 'next/link';
import { useCart } from '../hooks/useCart';

const categories = [
  { value: 'all', label: 'すべて' },
  { value: 'ranking', label: 'ランキング' },
  { value: 'limited', label: 'タイムセール' },
  { value: 'new', label: '新着商品' }
];

const navItems = ['本日のタイムセール', 'Nullランキング', '新着商品', 'もう一度買う', 'ギフト', 'クーポン'];

const SearchBar = () => (
  <Group gap={0} wrap='nowrap' style={{ flex: 1 }}>
    <Select
      data={categories}
      defaultValue='all'
      allowDeselect={false}
      visibleFrom='sm'
      w={118}
      styles={{
        input: {
          border: 0,
          borderRight: '1px solid #d5d9d9',
          backgroundColor: '#e6e6e6',
          height: 42,
          color: '#565959'
        }
      }}
    />
    <TextInput
      placeholder='Null cartで欲しいものを検索'
      style={{ flex: 1 }}
      styles={{
        input: {
          border: 0,
          height: 42,
          fontSize: 15
        }
      }}
    />
    <ActionIcon size={42} aria-label='検索' bg='#febd69' c='#111820' style={{ flexShrink: 0 }}>
      <IconSearch size={23} stroke={2.2} />
    </ActionIcon>
  </Group>
);

export const Header = () => {
  const { totalItems } = useCart();

  return (
    <Box component='header'>
      <style>{`
        .nc-header-link { border: 1px solid transparent; }
        .nc-header-link:hover { border-color: white; }
        .nc-nav-link { color: white; text-decoration: none; border-bottom: 2px solid transparent; }
        .nc-nav-link:hover { border-bottom-color: #febd69; }
      `}</style>

      <Box bg='#131921' py='xs'>
        <Container size='xl'>
          <Group gap='md' wrap='nowrap'>
            <Box
              component={Link}
              href='/null-cart'
              className='nc-header-link'
              px='xs'
              py={3}
              c='white'
              style={{ textDecoration: 'none', flexShrink: 0 }}
            >
              <Group gap={2} align='flex-end' wrap='nowrap'>
                <Text fz={25} fw='bold' lts={-1.4} lh={1}>
                  null
                </Text>
                <Text fz={20} fw='bold' c='#ff9900' lts={-1} lh={1}>
                  cart
                </Text>
                <Text fz={11} mb={1} c='gray.4'>
                  .jp
                </Text>
              </Group>
              <Box h={3} mt={3} ml='md' w={54} bg='#ff9900' style={{ transform: 'skewX(-28deg)' }} />
            </Box>

            <Group gap={4} visibleFrom='md' className='nc-header-link' px='xs' py={4} wrap='nowrap'>
              <IconMapPin size={19} color='white' />
              <Box>
                <Text fz={11} c='#cccccc' lh={1.1}>
                  お届け先
                </Text>
                <Text size='sm' fw='bold' c='white' lh={1.2}>
                  東京 100-0001
                </Text>
              </Box>
            </Group>

            <Box visibleFrom='sm' style={{ flex: 1 }}>
              <SearchBar />
            </Box>

            <Box visibleFrom='lg' className='nc-header-link' px='xs' py={4}>
              <Text fz={11} c='white' lh={1.1}>
                こんにちは、ゲストさん
              </Text>
              <Group gap={2} wrap='nowrap'>
                <Text size='sm' fw='bold' c='white' lh={1.2}>
                  アカウント＆リスト
                </Text>
                <IconChevronDown size={13} color='#cccccc' />
              </Group>
            </Box>

            <Box visibleFrom='md' className='nc-header-link' px='xs' py={4}>
              <Text fz={11} c='white' lh={1.1}>
                返品もこちら
              </Text>
              <Text size='sm' fw='bold' c='white' lh={1.2}>
                注文履歴
              </Text>
            </Box>

            <Box
              component={Link}
              href='/null-cart/cart'
              className='nc-header-link'
              c='white'
              px='xs'
              py={3}
              style={{ textDecoration: 'none', flexShrink: 0 }}
            >
              <Group gap={3} align='flex-end' wrap='nowrap'>
                <Box pos='relative'>
                  <IconShoppingCart size={35} stroke={1.8} />
                  <Text pos='absolute' top={-6} left={17} c='#f3a847' fz={17} fw='bold' lh={1} miw={20} ta='center'>
                    {totalItems}
                  </Text>
                </Box>
                <Text size='sm' fw='bold' visibleFrom='sm' mb={3}>
                  カート
                </Text>
              </Group>
            </Box>
          </Group>

          <Box hiddenFrom='sm' mt='xs'>
            <SearchBar />
          </Box>
        </Container>
      </Box>

      <Box bg='#232f3e'>
        <Container size='xl'>
          <Group gap='lg' wrap='nowrap' style={{ overflowX: 'auto' }}>
            <UnstyledButton className='nc-nav-link' py='xs' style={{ flexShrink: 0 }}>
              <Group gap={5} wrap='nowrap'>
                <IconMenu2 size={20} />
                <Text size='sm' fw='bold'>
                  すべて
                </Text>
              </Group>
            </UnstyledButton>
            {navItems.map((item) => (
              <Text
                component='a'
                href='#deals'
                key={item}
                className='nc-nav-link'
                py='xs'
                size='sm'
                style={{ flexShrink: 0 }}
              >
                {item}
              </Text>
            ))}
            <Text
              component={Link}
              href='/null-cart/generate'
              className='nc-nav-link'
              py='xs'
              size='sm'
              fw='bold'
              ml='auto'
              style={{ flexShrink: 0 }}
            >
              欲しい商品をつくる
            </Text>
          </Group>
        </Container>
      </Box>
    </Box>
  );
};
