'use client';

import { Box, Text } from '@mantine/core';
import { getProductEmoji, getTileBackground } from '../presentation';
import type { Item } from '../types';

type ProductVisualProps = {
  item: Item;
  compact?: boolean;
  height?: number;
  rotation?: number;
};

export const ProductVisual = ({ item, compact = false, height, rotation = -2 }: ProductVisualProps) => {
  const label = item.name.replace(/[\s・「」『』]/g, '').slice(0, 11);

  return (
    <Box
      pos='relative'
      h={height ?? (compact ? 150 : 220)}
      bg={getTileBackground(item)}
      style={{ overflow: 'hidden' }}
      aria-label={`${item.name}の商品イメージ`}
    >
      <Box
        pos='absolute'
        inset={0}
        opacity={0.5}
        style={{
          background:
            'radial-gradient(circle at 72% 18%, rgba(255,255,255,0.92) 0 7%, transparent 8%), linear-gradient(145deg, rgba(255,255,255,0.75), transparent 44%)'
        }}
      />
      <Box
        pos='absolute'
        left='50%'
        top='50%'
        w={compact ? 100 : 142}
        h={compact ? 104 : 150}
        bg='white'
        style={{
          transform: `translate(-50%, -47%) rotate(${rotation}deg)`,
          boxShadow: '0 16px 30px rgba(15, 17, 17, 0.2)',
          border: '1px solid rgba(15, 17, 17, 0.08)'
        }}
      >
        <Box
          h={compact ? 22 : 28}
          bg='#232f3e'
          px='xs'
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text c='white' fz={compact ? 7 : 8} fw='bold' lts={0.8}>
            NULL SELECT
          </Text>
          <Text c='#ff9900' fz={compact ? 8 : 10}>
            ●
          </Text>
        </Box>
        <Box h={compact ? 59 : 88} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text fz={compact ? 45 : 66} lh={1}>
            {getProductEmoji(item)}
          </Text>
        </Box>
        <Text px='xs' fz={compact ? 7 : 9} fw='bold' ta='center' lineClamp={2} c='#0f1111' lh={1.2}>
          {label}
        </Text>
      </Box>
      <Box
        pos='absolute'
        left='20%'
        right='20%'
        bottom={compact ? 8 : 13}
        h={compact ? 8 : 11}
        opacity={0.23}
        style={{ background: '#0f1111', filter: 'blur(8px)', borderRadius: '50%' }}
      />
    </Box>
  );
};
