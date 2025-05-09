// 選択肢ボタンコンポーネント
'use client';

import { Button } from '@mantine/core';

type Props = {
  choice: string;
  selected: string | null;
  answer: string;
  onSelect: (choice: string) => void;
  disabled: boolean;
};

export default function ChoiceButton({ choice, selected, answer, onSelect, disabled }: Props) {
  const isCorrect = selected && choice === answer;
  const isWrong = selected && choice === selected && choice !== answer;
  return (
    <Button
      fullWidth
      color={isCorrect ? 'green' : isWrong ? 'red' : selected ? 'gray' : 'blue'}
      variant={selected ? 'filled' : 'outline'}
      onClick={() => onSelect(choice)}
      disabled={disabled}
      style={{ fontWeight: isCorrect ? 'bold' : undefined }}
    >
      {choice}
    </Button>
  );
}
