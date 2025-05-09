'use client';

import { Box, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import type { AnkiRow, QuizQuestion } from './util';

// クイズの出題数
const QUIZ_COUNT = 5;

function createQuizQuestions(rows: AnkiRow[]): QuizQuestion[] {
  // 副題ごとにユニーク化
  const unique = Array.from(new Map(rows.map((row) => [row.副題, row])).values());

  // シャッフル
  const shuffled = unique.sort(() => Math.random() - 0.5);

  // 5問分だけ
  const selected = shuffled.slice(0, QUIZ_COUNT);

  // 選択肢生成
  return selected.map((row) => {
    // 正解
    const answer = row.タイトル;
    // 他のタイトルからランダムに3つ
    const others = unique
      .filter((r) => r.タイトル !== answer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((r) => r.タイトル);
    // 選択肢をシャッフル
    const choices = [answer, ...others].sort(() => Math.random() - 0.5);
    return {
      question: row.副題,
      choices,
      answer
    };
  });
}

export default function ArtQuizPage() {
  const [started, { open: startQuiz, close: resetQuiz }] = useDisclosure(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchQuiz = async () => {
    setLoading(true);
    setSelected(null);
    setScore(0);
    setCurrent(0);
    setShowResult(false);
    const res = await fetch('/api/art-quiz');
    const data: AnkiRow[] = await res.json();
    setQuestions(createQuizQuestions(data));
    setLoading(false);
  };

  // スタート
  const handleStart = async () => {
    await fetchQuiz();
    startQuiz();
  };

  // 選択肢クリック
  const handleSelect = (choice: string) => {
    if (selected) return; // すでに選択済み
    setSelected(choice);
    if (choice === questions[current].answer) {
      setScore((s) => s + 1);
    }
    // 1秒後に次へ or 結果
    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent((c) => c + 1);
        setSelected(null);
      } else {
        setShowResult(true);
      }
    }, 1000);
  };

  const handleReset = () => {
    resetQuiz();
    setQuestions([]);
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setShowResult(false);
  };

  if (loading) {
    return (
      <Box maw={500} mx='auto' mt='lg'>
        <Title order={2}>読み込み中...</Title>
      </Box>
    );
  }

  if (!started) {
    return (
      <Box maw={500} mx='auto' mt='lg'>
        <Title order={1} ta='center' mb='md'>
          ギリシャ神話クイズ
        </Title>
        <Group justify='center'>
          <Button size='lg' onClick={handleStart}>
            スタート
          </Button>
        </Group>
      </Box>
    );
  }

  if (showResult) {
    return (
      <Box maw={500} mx='auto' mt='lg'>
        <Title order={2} ta='center' mb='md'>
          結果発表
        </Title>
        <Text ta='center' size='xl' mb='md'>
          {QUIZ_COUNT}問中 {score}問正解！
        </Text>
        <Group justify='center'>
          <Button onClick={handleReset}>タイトルへ</Button>
        </Group>
      </Box>
    );
  }

  const q = questions[current];
  return (
    <Box maw={500} mx='auto' mt='lg'>
      <Paper shadow='xs' p='md' mb='md'>
        <Group justify='space-between' mb='xs'>
          <Text size='sm'>
            {current + 1} / {QUIZ_COUNT}
          </Text>
          <Text size='sm'>正解数: {score}</Text>
        </Group>
        <Title order={3} mb='sm'>
          {q.question}
        </Title>
        <Stack>
          {q.choices.map((choice) => {
            const isCorrect = selected && choice === q.answer;
            const isWrong = selected && choice === selected && choice !== q.answer;
            return (
              <Button
                key={choice}
                fullWidth
                color={isCorrect ? 'green' : isWrong ? 'red' : selected ? 'gray' : 'blue'}
                variant={selected ? 'filled' : 'outline'}
                onClick={() => handleSelect(choice)}
                disabled={!!selected}
                style={{ fontWeight: isCorrect ? 'bold' : undefined }}
              >
                {choice}
              </Button>
            );
          })}
        </Stack>
        {selected && (
          <Text mt='md' ta='center' size='lg' fw='bold' c={selected === q.answer ? 'green' : 'red'}>
            {selected === q.answer ? '正解！' : '不正解'}
          </Text>
        )}
      </Paper>
    </Box>
  );
}
