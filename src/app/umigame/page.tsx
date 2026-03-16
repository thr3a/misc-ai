'use client';

import { Avatar, Badge, Box, Button, Center, Group, Paper, Select, Stack, Text, Textarea } from '@mantine/core';
import { IconRobot } from '@tabler/icons-react';
import { useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

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
  const [maxQuestions, setMaxQuestions] = useState('5');
  const [events, setEvents] = useState<GameEvent[]>([
    { type: 'turn_start', turn: 1, maxTurns: 5 },
    { type: 'student_question', turn: 1, question: '男女は屋外にいましたか？' },
    { type: 'teacher_answer', turn: 1, answer: 'YES' },
    { type: 'turn_start', turn: 2, maxTurns: 5 },
    { type: 'student_question', turn: 2, question: 'お互いを叩いたのは意図的な行為でしたか？' },
    { type: 'teacher_answer', turn: 2, answer: 'YES' },
    { type: 'turn_start', turn: 3, maxTurns: 5 },
    { type: 'student_question', turn: 3, question: '第三者に見られたことが二人の助けになりましたか？' },
    { type: 'teacher_answer', turn: 3, answer: 'YES' },
    { type: 'turn_start', turn: 4, maxTurns: 5 },
    { type: 'student_question', turn: 4, question: '二人は危険な状況にいましたか？' },
    { type: 'teacher_answer', turn: 4, answer: 'YES' },
    { type: 'turn_start', turn: 5, maxTurns: 5 },
    { type: 'student_question', turn: 5, question: '叩き合っていたのは眠らないようにするためでしたか？' },
    { type: 'teacher_answer', turn: 5, answer: 'YES' },
    { type: 'final_phase' },
    {
      type: 'final_answer',
      answer:
        '男女は雪山で遭難していました。低体温症で眠ってしまうと命を落とす危険があったため、互いに叩き起こして眠らせないようにして夜をしのいでいました。そんな中、捜索隊に発見してもらったため、二人は喜びました。'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    if (!problem.trim() || !answer.trim()) return;
    setEvents([]);
    setIsLoading(true);

    const studentMessages: Message[] = [];
    const MAX_QUESTIONS = Number(maxQuestions);

    for (let turn = 1; turn <= MAX_QUESTIONS; turn++) {
      const remaining = MAX_QUESTIONS - turn + 1;
      setEvents((prev) => [...prev, { type: 'turn_start', turn, maxTurns: MAX_QUESTIONS }]);

      // 生徒の質問を生成
      const questionRes = await fetch('/api/umigame/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, messages: studentMessages, remaining, maxTurns: MAX_QUESTIONS })
      });

      if (!questionRes.ok) break;
      const studentTurn = await questionRes.json();

      if (studentTurn.action === 'FINAL_ANSWER') {
        setEvents((prev) => [...prev, { type: 'student_early_exit', turn }]);
        break;
      }

      const question: string = studentTurn.question ?? '';
      setEvents((prev) => [...prev, { type: 'student_question', turn, question }]);
      studentMessages.push({ role: 'assistant', content: question });

      // 先生の回答を取得
      const answerRes = await fetch('/api/umigame/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, answer, question })
      });

      if (!answerRes.ok) break;
      const teacherData = await answerRes.json();

      setEvents((prev) => [...prev, { type: 'teacher_answer', turn, answer: teacherData.answer }]);
      studentMessages.push({ role: 'user', content: `出題者の回答: ${teacherData.answer}` });
    }

    // 最終回答フェーズ
    setEvents((prev) => [...prev, { type: 'final_phase' }]);

    const finalRes = await fetch('/api/umigame/final', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem, messages: studentMessages })
    });

    if (finalRes.ok) {
      const finalData = await finalRes.json();
      setEvents((prev) => [...prev, { type: 'final_answer', answer: finalData.answer }]);
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
    <Box mb={'lg'}>
      <Stack>
        <Textarea label='問題文' rows={3} value={problem} onChange={(e) => setProblem(e.currentTarget.value)} />
        <Textarea
          label='正解と解説'
          placeholder=''
          rows={3}
          value={answer}
          onChange={(e) => setAnswer(e.currentTarget.value)}
        />
        <Select
          label='ターン数'
          value={maxQuestions}
          onChange={(v) => v && setMaxQuestions(v)}
          data={['5', '6', '7', '8', '9', '10']}
          w={120}
        />
        <Group justify='center'>
          <Button onClick={handleStart} loading={isLoading} disabled={!problem.trim() || !answer.trim()}>
            ゲーム開始!
          </Button>
        </Group>

        {qaPairs.length > 0 && (
          <Paper p='md' maw={600} bg={'gray.1'} mx='auto'>
            <Text fw='bold' mb='sm'>
              AIの思考プロセス
            </Text>
            <Stack gap='lg'>
              {qaPairs.map((qa) => (
                <Stack key={qa.turn} gap='xs'>
                  <Center>
                    <Text size='xs' fw='bold' c='dimmed' lts={1}>
                      ターン{qa.turn}
                    </Text>
                  </Center>
                  <Group align='center' gap='xs'>
                    <Avatar color='blue' radius='xl'>
                      <IconRobot size={20} />
                    </Avatar>
                    <Paper px='sm' py='xs' bg='white'>
                      <Text>{qa.question}</Text>
                    </Paper>
                  </Group>
                  {qa.answer && (
                    <Group justify='flex-end'>
                      <Badge size='lg' color={answerColor(qa.answer)} radius='xl' px='md'>
                        {qa.answer}
                      </Badge>
                    </Group>
                  )}
                </Stack>
              ))}
            </Stack>
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
