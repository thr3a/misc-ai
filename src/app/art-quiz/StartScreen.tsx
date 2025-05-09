// クイズ開始画面コンポーネント
'use client';

import { Box, Button, Group, Title } from '@mantine/core';

type Props = {
  onStart: () => void;
};

export default function StartScreen({ onStart }: Props) {
  return (
    <Box mt='lg'>
      <Title order={1} ta='center' mb='md'>
        ギリシャ神話クイズ
      </Title>
      <Group justify='center'>
        <Button size='lg' onClick={onStart}>
          スタート
        </Button>
      </Group>
    </Box>
  );
}
