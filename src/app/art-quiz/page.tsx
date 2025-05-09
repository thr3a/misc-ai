'use client';

import { Box, Button, Loader, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import QuizScreen from './QuizScreen';
import ResultScreen from './ResultScreen';
import StartScreen from './StartScreen';
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
  const [error, setError] = useState<string | null>(null);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    setSelected(null);
    setScore(0);
    setCurrent(0);
    setShowResult(false);
    try {
      const res = await fetch('/api/art-quiz');
      if (!res.ok) throw new Error('APIリクエストに失敗しました');
      const data: AnkiRow[] = await res.json();
      setQuestions(createQuizQuestions(data));
    } catch (e: any) {
      setError(e?.message || '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    await fetchQuiz();
    startQuiz();
  };

  const handleSelect = (choice: string) => {
    if (selected) return;
    setSelected(choice);
    if (choice === questions[current].answer) {
      setScore((s) => s + 1);
    }
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
      <Box mt='lg' style={{ textAlign: 'center' }}>
        <Loader size='lg' mt='xl' />
        <Title order={2} mt='md'>
          読み込み中...
        </Title>
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt='lg' style={{ textAlign: 'center' }}>
        <Title order={2} c='red' mb='md'>
          エラー
        </Title>
        <Text c='red' mb='md'>
          {error}
        </Text>
        <Button onClick={() => fetchQuiz()}>再読み込み</Button>
      </Box>
    );
  }

  if (!started) {
    return <StartScreen onStart={handleStart} />;
  }

  if (showResult) {
    return <ResultScreen score={score} onReset={handleReset} />;
  }

  const q = questions[current];
  return (
    <QuizScreen
      question={q}
      current={current}
      total={QUIZ_COUNT}
      score={score}
      selected={selected}
      onSelect={handleSelect}
    />
  );
}
