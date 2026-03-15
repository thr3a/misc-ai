'use client';

import { Badge, Box, Button, Group, Paper, Stack, Text, Textarea, Timeline } from '@mantine/core';
import { useState } from 'react';
import { IconHelpHexagon } from '@tabler/icons-react';

type GameEvent =
  | { type: 'turn_start'; turn: number; maxTurns: number }
  | { type: 'student_question'; turn: number; question: string }
  | { type: 'teacher_answer'; turn: number; answer: string }
  | { type: 'student_early_exit'; turn: number }
  | { type: 'final_phase' }
  | { type: 'final_answer'; answer: string };

const answerColor = (answer: string) => {
  if (answer === 'YES') return 'green';
  if (answer === 'NO') return 'red';
  return 'gray';
};

export default function Page() {
  const [problem, setProblem] = useState(
    '男女は一晩中お互いを叩き合っていた。ところが、その様子を第三者に見られてしまった。しかし、見られた男女は怒るどころか、むしろ喜んだ。一体なぜ？'
  );
  const [answer, setAnswer] = useState(
    '男女は雪山で遭難していました。低体温症で眠ってしまうと命を落とす危険があったため、互いに叩き起こして眠らせないようにして夜をしのいでいました。そんな中、捜索隊に発見して貰ったため、喜びました。'
  );
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    if (!problem.trim() || !answer.trim()) return;
    setEvents([]);
    setIsLoading(true);

    const res = await fetch('/api/umigame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem, answer })
    });

    if (!res.ok || !res.body) {
      setIsLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      let currentEventType = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEventType = line.slice(7);
        } else if (line.startsWith('data: ') && currentEventType) {
          const data = JSON.parse(line.slice(6));
          const event = { type: currentEventType, ...data } as GameEvent;
          setEvents((prev) => [...prev, event]);
          currentEventType = '';
        }
      }
    }

    setIsLoading(false);
  };

  // QAペアを組み立てる
  const qaPairs: { turn: number; question: string; answer: string }[] = [];
  for (const e of events) {
    if (e.type === 'student_question') {
      qaPairs.push({ turn: e.turn, question: e.question, answer: '' });
    } else if (e.type === 'teacher_answer') {
      const pair = qaPairs.find((p) => p.turn === e.turn);
      if (pair) pair.answer = e.answer;
    }
  }

  const finalAnswerEvent = events.find((e) => e.type === 'final_answer');
  const hasFinalPhase = events.some((e) => e.type === 'final_phase');

  return (
    <Box>
      <Stack>
        <Textarea
          label='ウミガメのスープの問題文を入力してください'
          rows={5}
          value={problem}
          onChange={(e) => setProblem(e.currentTarget.value)}
        />
        <Textarea
          label='正解と解説を入力してください'
          placeholder=''
          rows={5}
          value={answer}
          onChange={(e) => setAnswer(e.currentTarget.value)}
        />
        <Group justify='center'>
          <Button onClick={handleStart} loading={isLoading} disabled={!problem.trim() || !answer.trim()}>
            ゲーム開始!
          </Button>
        </Group>

        {qaPairs.length > 0 && (
          <Paper p='md'>
            <Text fw='bold' mb='sm'>
              質問ログ
            </Text>
            <Timeline radius={'sm'} active={qaPairs.length - 1} lineWidth={3} bulletSize={26}>
              {qaPairs.map((qa) => (
                <Timeline.Item bullet={<IconHelpHexagon stroke={2} />} key={qa.turn} title={`ターン ${qa.turn}`}>
                  <Text size='sm'>{qa.question}</Text>
                  {qa.answer && (
                    <Badge mt='xs' color={answerColor(qa.answer)}>
                      {qa.answer}
                    </Badge>
                  )}
                </Timeline.Item>
              ))}
            </Timeline>
          </Paper>
        )}

        {hasFinalPhase && (
          <Paper p='md' withBorder>
            <Text fw='bold' mb='sm'>
              最終回答
            </Text>
            {finalAnswerEvent && finalAnswerEvent.type === 'final_answer' ? (
              <Text style={{ whiteSpace: 'pre-wrap' }}>{finalAnswerEvent.answer}</Text>
            ) : (
              <Text c='dimmed'>回答生成中...</Text>
            )}
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
