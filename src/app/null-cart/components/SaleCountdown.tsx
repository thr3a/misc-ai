'use client';

import { Box, Group, Text } from '@mantine/core';
import { useInterval, useMounted } from '@mantine/hooks';
import dayjs from 'dayjs';
import { useState } from 'react';

type SaleCountdownProps = {
  label?: string;
  compact?: boolean;
  labelColor?: string;
};

type Remaining = {
  hours: string;
  minutes: string;
  seconds: string;
};

const pad = (value: number): string => String(value).padStart(2, '0');

// 「本日限り」の演出として、その日の 23:59:59 までの残り時間を返す
const getRemaining = (): Remaining => {
  const now = dayjs();
  const totalSeconds = Math.max(now.endOf('day').diff(now, 'second'), 0);
  return {
    hours: pad(Math.floor(totalSeconds / 3600)),
    minutes: pad(Math.floor((totalSeconds % 3600) / 60)),
    seconds: pad(totalSeconds % 60)
  };
};

export const SaleCountdown = ({ label = 'セール終了まで残り', compact = false, labelColor }: SaleCountdownProps) => {
  const mounted = useMounted();
  const [remaining, setRemaining] = useState<Remaining>(getRemaining);

  useInterval(() => setRemaining(getRemaining()), 1000, { autoInvoke: true });

  if (!mounted) {
    return null;
  }

  const digitFontSize = compact ? 15 : 22;
  const digitPadding = compact ? '2px 6px' : '4px 10px';

  const digitBox = (value: string) => (
    <Box
      style={{
        backgroundColor: '#0F1111',
        color: 'white',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        fontSize: digitFontSize,
        padding: digitPadding,
        borderRadius: 4,
        minWidth: compact ? 30 : 44,
        textAlign: 'center'
      }}
    >
      {value}
    </Box>
  );

  const separator = (
    <Text fw='bold' c={labelColor ?? '#E31837'} fz={digitFontSize}>
      :
    </Text>
  );

  return (
    <Group gap={compact ? 6 : 'sm'} align='center' wrap='nowrap'>
      <Text size={compact ? 'xs' : 'sm'} fw='bold' c={labelColor ?? '#E31837'} style={{ whiteSpace: 'nowrap' }}>
        {label}
      </Text>
      <Group gap={4} align='center' wrap='nowrap'>
        {digitBox(remaining.hours)}
        {separator}
        {digitBox(remaining.minutes)}
        {separator}
        {digitBox(remaining.seconds)}
      </Group>
    </Group>
  );
};
