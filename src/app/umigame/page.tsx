'use client';

import { Avatar, Badge, Box, Button, Divider, Group, Loader, Paper, Stack, Text, Textarea } from '@mantine/core';
import { IconCheck, IconRobot, IconX } from '@tabler/icons-react';
import { useState } from 'react';

const QUESTIONS_PER_ROUND = 5;

type Message = { role: 'user' | 'assistant'; content: string };

type GameEvent =
  | { type: 'round_start'; round: number }
  | { type: 'student_question'; turn: number; question: string }
  | { type: 'teacher_answer'; turn: number; answer: string }
  | { type: 'student_final_attempt'; round: number; answer: string }
  | { type: 'teacher_judgment'; round: number; correct: boolean }
  | { type: 'game_clear'; round: number };

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

    const studentMessages: Message[] = [];
    let roundNumber = 0;
    let cleared = false;

    while (!cleared) {
      roundNumber++;
      setEvents((prev) => [...prev, { type: 'round_start', round: roundNumber }]);

      // 5回質問フェーズ
      for (let q = 1; q <= QUESTIONS_PER_ROUND; q++) {
        const turn = (roundNumber - 1) * QUESTIONS_PER_ROUND + q;

        const questionRes = await fetch('/api/umigame/question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problem, messages: studentMessages })
        });

        if (!questionRes.ok) {
          setIsLoading(false);
          return;
        }

        const { question } = await questionRes.json();
        setEvents((prev) => [...prev, { type: 'student_question', turn, question }]);
        studentMessages.push({ role: 'assistant', content: question });

        const answerRes = await fetch('/api/umigame/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problem, answer, question })
        });

        if (!answerRes.ok) {
          setIsLoading(false);
          return;
        }

        const teacherData = await answerRes.json();
        setEvents((prev) => [...prev, { type: 'teacher_answer', turn, answer: teacherData.answer }]);
        studentMessages.push({ role: 'user', content: `出題者の回答: ${teacherData.answer}` });
      }

      // 強制回答フェーズ
      const guessRes = await fetch('/api/umigame/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, answer, messages: studentMessages })
      });

      if (!guessRes.ok) {
        setIsLoading(false);
        return;
      }

      const { finalAnswer, correct } = await guessRes.json();
      setEvents((prev) => [...prev, { type: 'student_final_attempt', round: roundNumber, answer: finalAnswer }]);
      setEvents((prev) => [...prev, { type: 'teacher_judgment', round: roundNumber, correct }]);

      if (correct) {
        setEvents((prev) => [...prev, { type: 'game_clear', round: roundNumber }]);
        cleared = true;
      } else {
        studentMessages.push({ role: 'assistant', content: `最終回答: ${finalAnswer}` });
        studentMessages.push({
          role: 'user',
          content: '不正解です。引き続き質問を続けて真相に迫ってください。'
        });
      }
    }

    setIsLoading(false);
  };

  const gameClear = events.find((e) => e.type === 'game_clear');
  const hasEvents = events.length > 0;

  return (
    <Box mb='lg'>
      <Stack>
        <Textarea label='問題文' rows={3} value={problem} onChange={(e) => setProblem(e.currentTarget.value)} />
        <Textarea label='正解と解説' rows={3} value={answer} onChange={(e) => setAnswer(e.currentTarget.value)} />
        <Group justify='center'>
          <Button onClick={handleStart} loading={isLoading} disabled={!problem.trim() || !answer.trim()}>
            ゲーム開始!
          </Button>
        </Group>

        {(isLoading || hasEvents) && (
          <Paper p='md' w='100%' maw={600} bg='gray.1' mx='auto'>
            <Text fw='bold' mb='sm'>
              AIの思考プロセス
            </Text>
            <Stack gap='lg'>
              {events.map((event) => {
                if (event.type === 'round_start') {
                  return (
                    <Divider
                      key={`rs-${event.round}`}
                      label={
                        <Text size='xs' fw='bold' c='dimmed'>
                          ラウンド {event.round}
                        </Text>
                      }
                      labelPosition='center'
                    />
                  );
                }
                if (event.type === 'student_question') {
                  return (
                    <Group key={`sq-${event.turn}`} align='flex-start' gap='xs' wrap='nowrap'>
                      <Avatar color='blue' radius='xl' style={{ flexShrink: 0 }}>
                        <IconRobot size={20} />
                      </Avatar>
                      <Paper px='sm' py='xs' bg='white' flex={1}>
                        <Text>{event.question}</Text>
                      </Paper>
                    </Group>
                  );
                }
                if (event.type === 'teacher_answer') {
                  return (
                    <Group key={`ta-${event.turn}`} justify='flex-end'>
                      <Badge size='lg' color={answerColor(event.answer)} radius='xl' px='md'>
                        {event.answer}
                      </Badge>
                    </Group>
                  );
                }
                if (event.type === 'student_final_attempt') {
                  return (
                    <Stack key={`fa-${event.round}`} gap='xs'>
                      <Text size='xs' fw='bold' c='dimmed' ta='center'>
                        最終回答（ラウンド {event.round}）
                      </Text>
                      <Group align='flex-start' gap='xs' wrap='nowrap'>
                        <Avatar color='violet' radius='xl' style={{ flexShrink: 0 }}>
                          <IconRobot size={20} />
                        </Avatar>
                        <Paper px='sm' py='xs' bg='white' flex={1}>
                          <Text style={{ whiteSpace: 'pre-wrap' }}>{event.answer}</Text>
                        </Paper>
                      </Group>
                    </Stack>
                  );
                }
                if (event.type === 'teacher_judgment') {
                  return (
                    <Group key={`tj-${event.round}`} justify='flex-end'>
                      <Badge
                        size='lg'
                        color={event.correct ? 'green' : 'red'}
                        radius='xl'
                        px='md'
                        leftSection={event.correct ? <IconCheck size={14} /> : <IconX size={14} />}
                      >
                        {event.correct ? '正解！' : '不正解'}
                      </Badge>
                    </Group>
                  );
                }
                if (event.type === 'game_clear') {
                  return (
                    <Paper key='gc' p='sm' bg='green.1' bd='1px solid var(--mantine-color-green-4)'>
                      <Text fw='bold' c='green' ta='center'>
                        {event.round} ラウンドで正解！
                      </Text>
                    </Paper>
                  );
                }
                return null;
              })}
              {isLoading && !gameClear && (
                <Group align='flex-start' gap='xs' wrap='nowrap'>
                  <Avatar color='blue' radius='xl' style={{ flexShrink: 0 }}>
                    <IconRobot size={20} />
                  </Avatar>
                  <Paper px='sm' py='xs' bg='white' flex={1}>
                    <Loader size='xs' />
                  </Paper>
                </Group>
              )}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
