'use client';

import { Box, Group, Stack, Text } from '@mantine/core';
import { IconShoppingBagCheck } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import type { Item } from '../types';

const surnames = ['田中', '佐藤', '鈴木', '高橋', '伊藤', '渡辺', '山本', '中村', '小林', '加藤'];
const prefectures = ['東京都', '大阪府', '神奈川県', '愛知県', '福岡県', '北海道', '埼玉県', '京都府', '広島県'];

type ProofMessage = {
  key: number;
  buyer: string;
  itemName: string;
  minutesAgo: number;
};

const pickRandom = <T,>(pool: readonly T[]): T => pool[Math.floor(Math.random() * pool.length)];

type SocialProofToastProps = {
  items: Item[];
};

// 「◯◯さんが購入しました」をランダムなタイミングで流し、賑わいを演出する
export const SocialProofToast = ({ items }: SocialProofToastProps) => {
  const [message, setMessage] = useState<ProofMessage | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    const schedule = (delay: number) => {
      timers.push(
        setTimeout(() => {
          setMessage({
            key: Date.now(),
            buyer: `${pickRandom(prefectures)}の${pickRandom(surnames)}さん`,
            itemName: pickRandom(items).name,
            minutesAgo: 1 + Math.floor(Math.random() * 29)
          });
          setVisible(true);
          timers.push(setTimeout(() => setVisible(false), 4500));
          // 次の表示まで 7〜14 秒のランダム間隔
          schedule(7000 + Math.random() * 7000);
        }, delay)
      );
    };

    schedule(3000 + Math.random() * 3000);

    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [items]);

  if (!message) {
    return null;
  }

  return (
    <Box
      style={{
        position: 'fixed',
        left: 16,
        bottom: 16,
        zIndex: 300,
        maxWidth: 320,
        backgroundColor: 'white',
        borderLeft: '4px solid #FF9900',
        boxShadow: '0 6px 20px rgba(15, 17, 17, 0.25)',
        borderRadius: 4,
        padding: '10px 14px',
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease'
      }}
    >
      <Group gap='sm' align='flex-start' wrap='nowrap'>
        <IconShoppingBagCheck size={22} color='#FF9900' style={{ flexShrink: 0, marginTop: 2 }} />
        <Stack gap={2}>
          <Text size='sm' c='#0F1111'>
            <Text component='span' fw='bold'>
              {message.buyer}
            </Text>
            が
            <Text component='span' fw='bold'>
              「{message.itemName}」
            </Text>
            を購入しました
          </Text>
          <Text size='xs' c='#565959'>
            {message.minutesAgo}分前
          </Text>
        </Stack>
      </Group>
    </Box>
  );
};
