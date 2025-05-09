// クイズ開始画面コンポーネント
'use client';

import { Box, Button, Group, Title } from '@mantine/core';

type Props = {
  onStart: (count: number) => void;
};

export default function StartScreen({ onStart }: Props) {
  return (
    <Box mt='lg'>
      <Title order={1} ta='center' mb='md'>
        ギリシャ神話クイズ
      </Title>
      <Group justify='center'>
        <Button size='lg' onClick={() => onStart(5)} mr='md'>
          5問で遊ぶ
        </Button>
        <Button size='lg' color='teal' onClick={() => onStart(0)}>
          全問で遊ぶ
        </Button>
      </Group>
    </Box>
  );
}
