// クイズ問題表示画面コンポーネント
'use client';

import { Box, Group, Paper, Stack, Text, Title } from '@mantine/core';
import ChoiceButton from './ChoiceButton';
import type { QuizQuestion } from './util';

type Props = {
  question: QuizQuestion;
  current: number;
  total: number;
  score: number;
  selected: string | null;
  onSelect: (choice: string) => void;
};

export default function QuizScreen({ question, current, total, score, selected, onSelect }: Props) {
  return (
    <Box mt='lg'>
      <Paper shadow='xs' p='md' mb='md'>
        <Group justify='space-between' mb='xs'>
          <Text size='sm'>
            {current + 1} / {total}
          </Text>
          <Text size='sm'>正解数: {score}</Text>
        </Group>
        <Title order={3} mb='sm'>
          {question.question}
        </Title>
        <Stack>
          {question.choices.map((choice) => (
            <ChoiceButton
              key={choice}
              choice={choice}
              selected={selected}
              answer={question.answer}
              onSelect={onSelect}
              disabled={!!selected}
            />
          ))}
        </Stack>
        {selected && (
          <Text mt='md' ta='center' size='lg' fw='bold' c={selected === question.answer ? 'green' : 'red'}>
            {selected === question.answer ? '正解！' : '不正解'}
          </Text>
        )}
      </Paper>
    </Box>
  );
}
