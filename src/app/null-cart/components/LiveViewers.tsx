'use client';

import { Box, Group, Text } from '@mantine/core';
import { useInterval, useMounted } from '@mantine/hooks';
import { useState } from 'react';

type LiveViewersProps = {
  baseCount: number;
  label: string;
  color?: string;
};

// 「現在◯人が見ています」を数秒ごとに揺らしてライブ感を出す
export const LiveViewers = ({ baseCount, label, color = '#B12704' }: LiveViewersProps) => {
  const mounted = useMounted();
  const [offset, setOffset] = useState(0);

  useInterval(() => setOffset(Math.floor(Math.random() * 9) - 4), 3500, { autoInvoke: true });

  if (!mounted) {
    return null;
  }

  const count = Math.max(baseCount + offset, 1);

  return (
    <Group gap={6} align='center' wrap='nowrap'>
      <style>{`
        @keyframes ncLiveDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
      <Box
        w={9}
        h={9}
        style={{
          backgroundColor: '#E31837',
          borderRadius: '50%',
          animation: 'ncLiveDot 1.2s ease-in-out infinite',
          flexShrink: 0
        }}
      />
      <Text size='sm' fw='bold' c={color}>
        現在 {count}人 {label}
      </Text>
    </Group>
  );
};
