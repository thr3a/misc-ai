// クイズ開始画面コンポーネント
'use client';

import { Box, Button, Group, Select, Title } from '@mantine/core';

type Props = {
  onStart: (count: number, genre: string) => void;
  genre: string;
  setGenre: (genre: string) => void;
};

export default function StartScreen({ onStart, genre, setGenre }: Props) {
  return (
    <Box mt='lg'>
      <Title order={1} ta='center' mb='md'>
        アートクイズ
      </Title>
      <Box maw={300} mx='auto' mb='md'>
        <Select
          label='カテゴリを選択'
          // ジャンルを追加する場合はここに追記
          data={[
            { value: 'ギリシャ神話', label: 'ギリシャ神話' },
            { value: '旧約聖書', label: '旧約聖書' }
          ]}
          value={genre}
          onChange={(v) => v && setGenre(v)}
        />
      </Box>
      <Group justify='center'>
        <Button size='lg' onClick={() => onStart(5, genre)} mr='md'>
          5問で遊ぶ
        </Button>
        <Button size='lg' color='teal' onClick={() => onStart(0, genre)}>
          全問で遊ぶ
        </Button>
      </Group>
    </Box>
  );
}
