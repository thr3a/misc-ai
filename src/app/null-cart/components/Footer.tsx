'use client';

import { Box, Container, Divider, Group, SimpleGrid, Stack, Text } from '@mantine/core';

const footerColumns = [
  { title: 'Null cartについて', links: ['はじめての方へ', '架空決済の仕組み', '浪費しない買い物体験'] },
  { title: 'ショッピングガイド', links: ['タイムセール', 'ランキング', '注文履歴'] },
  { title: 'ヘルプ＆サポート', links: ['配送について', '返品について', 'お問い合わせ'] }
];

export const Footer = () => (
  <Box component='footer' mt='xl'>
    <Box bg='#37475a' py='sm'>
      <Text component='a' href='#' display='block' ta='center' c='white' size='sm' style={{ textDecoration: 'none' }}>
        トップへ戻る
      </Text>
    </Box>
    <Box bg='#232f3e' py='xl'>
      <Container size='md'>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing='xl'>
          {footerColumns.map((column) => (
            <Stack gap='xs' key={column.title}>
              <Text c='white' fw='bold'>
                {column.title}
              </Text>
              {column.links.map((link) => (
                <Text key={link} c='gray.4' size='sm'>
                  {link}
                </Text>
              ))}
            </Stack>
          ))}
        </SimpleGrid>
        <Divider my='xl' color='#3a4553' />
        <Group justify='center' gap='xs'>
          <Text c='white' fw='bold' fz={20}>
            null
            <Text component='span' c='#ff9900'>
              cart
            </Text>
          </Text>
          <Text c='gray.4' size='sm'>
            日本語 | ¥ JPY
          </Text>
        </Group>
      </Container>
    </Box>
    <Box bg='#131a22' py='lg'>
      <Container size='xl'>
        <Text ta='center' c='gray.5' fz={11}>
          © 2026 Null cart —
          このサイトは購入欲求を安全に満たすための架空ECサイトです。請求・発送・メール送信は一切発生しません。
        </Text>
      </Container>
    </Box>
  </Box>
);
