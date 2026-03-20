import { Button, Group, Stack, Text, Textarea } from '@mantine/core';
import { ButtonCopy } from '@/app/html-ui/ButtonCopy';

type QuestionInputProps = {
  question: string;
  onQuestionChange: (value: string) => void;
  onBroadcast: () => void;
  onEnhance: () => void;
  isEnhancing: boolean;
  errorMessage: string | null;
};

export const QuestionInput = ({
  question,
  onQuestionChange,
  onBroadcast,
  onEnhance,
  isEnhancing,
  errorMessage
}: QuestionInputProps) => {
  const isQuestionEmpty = question.length === 0;

  return (
    <Stack gap='xs'>
      <Textarea
        label={'質問内容'}
        value={question}
        onChange={(e) => onQuestionChange(e.currentTarget.value)}
        autosize
        minRows={5}
        maxRows={10}
        placeholder='スプラトゥーンが流行った理由は？'
      />
      <Group justify='center' align='center'>
        <Button size='sm' disabled={isQuestionEmpty} onClick={onBroadcast}>
          送信
        </Button>
        <Button size='sm' variant='light' loading={isEnhancing} disabled={isQuestionEmpty} onClick={onEnhance}>
          強化
        </Button>
        <ButtonCopy content={question} disabled={isQuestionEmpty} />
      </Group>

      {errorMessage && (
        <Text size='xs' c='red' ta='center'>
          {errorMessage}
        </Text>
      )}
    </Stack>
  );
};
