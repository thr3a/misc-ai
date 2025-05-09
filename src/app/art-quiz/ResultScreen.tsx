// クイズ結果画面コンポーネント
'use client';

import { Box, Button, Group, Text, Title } from '@mantine/core';

type Props = {
  score: number;
  onReset: () => void;
  total: number;
};

export default function ResultScreen({ score, onReset, total }: Props) {
  return (
    <Box mt='lg'>
      <Title order={2} ta='center' mb='md'>
        結果発表
      </Title>
      <Text ta='center' size='xl' mb='md'>
        {total}問中 {score}問正解！
      </Text>
      <Group justify='center'>
        <Button onClick={onReset}>もう一度挑戦</Button>
      </Group>
    </Box>
  );
}
