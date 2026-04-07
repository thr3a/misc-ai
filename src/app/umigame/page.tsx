'use client';

import { Avatar, Badge, Box, Button, Group, Loader, Paper, Stack, Text, Textarea } from '@mantine/core';
import { IconCheck, IconRobot, IconX } from '@tabler/icons-react';
import { useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

type GameEvent =
  | { type: 'student_question'; turn: number; question: string }
  | { type: 'teacher_answer'; turn: number; answer: string }
  | { type: 'student_final_attempt'; turn: number; answer: string }
  | { type: 'teacher_judgment'; turn: number; correct: boolean }
  | { type: 'game_clear'; answer: string };

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
    let turn = 0;

    while (true) {
      turn++;

      const questionRes = await fetch('/api/umigame/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, messages: studentMessages })
      });

      if (!questionRes.ok) break;
      const studentTurn = await questionRes.json();

      if (studentTurn.action === 'ASK') {
        const question: string = studentTurn.question ?? '';
        setEvents((prev) => [...prev, { type: 'student_question', turn, question }]);
        studentMessages.push({ role: 'assistant', content: question });

        const answerRes = await fetch('/api/umigame/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problem, answer, question })
        });

        if (!answerRes.ok) break;
        const teacherData = await answerRes.json();

        setEvents((prev) => [...prev, { type: 'teacher_answer', turn, answer: teacherData.answer }]);
        studentMessages.push({ role: 'user', content: `出題者の回答: ${teacherData.answer}` });
      } else {
        // FINAL_ANSWER
        const finalAnswer: string = studentTurn.finalAnswer ?? '';
        setEvents((prev) => [...prev, { type: 'student_final_attempt', turn, answer: finalAnswer }]);

        const judgmentRes = await fetch('/api/umigame/final', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problem, answer, studentAnswer: finalAnswer })
        });

        if (!judgmentRes.ok) break;
        const judgment = await judgmentRes.json();

        setEvents((prev) => [...prev, { type: 'teacher_judgment', turn, correct: judgment.correct }]);

        if (judgment.correct) {
          setEvents((prev) => [...prev, { type: 'game_clear', answer: finalAnswer }]);
          break;
        }

        // 不正解だったのでコンテキストに追加して質問を継続
        studentMessages.push({ role: 'assistant', content: `最終回答: ${finalAnswer}` });
        studentMessages.push({ role: 'user', content: '不正解です。引き続き質問を続けて推理してください。' });
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
                if (event.type === 'student_question') {
                  return (
                    <Stack key={`sq-${event.turn}`} gap='xs'>
                      <Group align='flex-start' gap='xs' wrap='nowrap'>
                        <Avatar color='blue' radius='xl' style={{ flexShrink: 0 }}>
                          <IconRobot size={20} />
                        </Avatar>
                        <Paper px='sm' py='xs' bg='white' flex={1}>
                          <Text>{event.question}</Text>
                        </Paper>
                      </Group>
                    </Stack>
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
                    <Stack key={`fa-${event.turn}`} gap='xs'>
                      <Text size='xs' fw='bold' c='dimmed' ta='center' lts={1}>
                        最終回答
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
                    <Group key={`tj-${event.turn}`} justify='flex-end'>
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

        {gameClear && gameClear.type === 'game_clear' && (
          <Paper p='md' withBorder bd='2px solid var(--mantine-color-green-6)'>
            <Text fw='bold' mb='sm' c='green'>
              正解！
            </Text>
            <Text style={{ whiteSpace: 'pre-wrap' }}>{gameClear.answer}</Text>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
