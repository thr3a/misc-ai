'use client';

import { ActionIcon, Box, Container, Group, Text, TextInput } from '@mantine/core';
import { IconMapPin, IconSearch, IconShoppingCart } from '@tabler/icons-react';
import Link from 'next/link';
import { useCart } from '../hooks/useCart';

export const Header = () => {
  const { totalItems } = useCart();

  return (
    <>
      {/* メインヘッダー */}
      <Box bg='#131921' py={8}>
        <Container size='xl'>
          <Group justify='space-between' align='center' gap='md'>
            {/* ロゴ */}
            <Link href='/null-cart' style={{ textDecoration: 'none', flexShrink: 0 }}>
              <Box
                style={{
                  border: '1px solid transparent',
                  padding: '2px 6px',
                  borderRadius: 2
                }}
                onMouseEnter={(e) => {
                  // イベントターゲットはHTMLElement型であることが保証されているためasを使用
                  (e.currentTarget as HTMLElement).style.borderColor = 'white';
                }}
                onMouseLeave={(e) => {
                  // イベントターゲットはHTMLElement型であることが保証されているためasを使用
                  (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                }}
              >
                <Text fw='bold' size='xl' c='white' style={{ letterSpacing: '-0.5px' }}>
                  Null cart
                </Text>
              </Box>
            </Link>

            {/* お届け先 */}
            <Group gap={4} style={{ flexShrink: 0, cursor: 'default' }}>
              <IconMapPin size={18} color='#ccc' />
              <Box>
                <Text size='xs' c='#ccc' style={{ lineHeight: 1 }}>
                  お届け先
                </Text>
                <Text size='sm' fw='bold' c='white' style={{ lineHeight: 1.2 }}>
                  東京都 千代田区
                </Text>
              </Box>
            </Group>

            {/* 検索バー（スマホでは非表示） */}
            <Box visibleFrom='sm' style={{ flex: 1, minWidth: 0 }}>
              <Group gap={0}>
                <TextInput
                  placeholder='null-cartを検索'
                  style={{ flex: 1 }}
                  styles={{
                    input: {
                      borderRadius: '4px 0 0 4px',
                      border: 'none',
                      height: 40,
                      fontSize: 14
                    }
                  }}
                />
                <ActionIcon
                  size={40}
                  style={{
                    backgroundColor: '#FF9900',
                    borderRadius: '0 4px 4px 0',
                    color: '#000',
                    flexShrink: 0
                  }}
                >
                  <IconSearch size={20} />
                </ActionIcon>
              </Group>
            </Box>

            {/* カート */}
            <Box
              component={Link}
              href='/null-cart/cart'
              style={{
                color: 'white',
                textDecoration: 'none',
                flexShrink: 0,
                border: '1px solid transparent',
                borderRadius: 2,
                padding: '2px 6px'
              }}
              onMouseEnter={(e) => {
                // イベントターゲットはHTMLElement型であることが保証されているためasを使用
                (e.currentTarget as HTMLElement).style.borderColor = 'white';
              }}
              onMouseLeave={(e) => {
                // イベントターゲットはHTMLElement型であることが保証されているためasを使用
                (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
              }}
            >
              <Group gap={4} align='center'>
                <Box style={{ position: 'relative' }}>
                  <IconShoppingCart size={32} />
                  {totalItems > 0 && (
                    <Box
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        backgroundColor: '#FF9900',
                        color: '#000',
                        borderRadius: '50%',
                        minWidth: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '0 3px'
                      }}
                    >
                      {totalItems}
                    </Box>
                  )}
                </Box>
                <Text size='sm' fw='bold' style={{ lineHeight: 1 }} visibleFrom='sm'>
                  カート
                </Text>
              </Group>
            </Box>
          </Group>
        </Container>
      </Box>
    </>
  );
};
