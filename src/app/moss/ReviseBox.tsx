import { Alert, Button, Group, Paper, Stack, Text, Textarea } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import { useState } from 'react';

type Props = {
  label: string;
  description: string;
  placeholder: string;
  // この欄のリライトを実行中
  loading: boolean;
  // どちらかのリライトを実行中
  busy: boolean;
  // 失敗時はエラーメッセージ、成功時は null を返す
  onSubmit: (instruction: string) => Promise<string | null>;
};

// AI への修正指示の入力欄。成功したら入力を空にする
export const ReviseBox = ({ label, description, placeholder, loading, busy, onSubmit }: Props) => {
  const [instruction, setInstruction] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const value = instruction.trim();
    if (!value) return;
    setError('');
    const message = await onSubmit(value);
    if (message) {
      setError(message);
      return;
    }
    setInstruction('');
  };

  return (
    <Paper withBorder p='sm'>
      <Stack gap='xs'>
        <Group gap='xs'>
          <IconSparkles size={16} />
          <Text size='sm' fw='bold'>
            {label}
          </Text>
        </Group>
        <Text size='xs' c='dimmed'>
          {description}
        </Text>
        <Group align='flex-end' wrap='nowrap'>
          <Textarea
            flex={1}
            autosize
            minRows={2}
            maxRows={6}
            placeholder={placeholder}
            value={instruction}
            disabled={busy}
            onChange={(e) => setInstruction(e.currentTarget.value)}
          />
          <Button onClick={handleSubmit} loading={loading} disabled={(busy && !loading) || !instruction.trim()}>
            送信
          </Button>
        </Group>
        {error && (
          <Alert color='red' withCloseButton onClose={() => setError('')}>
            {error}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};
