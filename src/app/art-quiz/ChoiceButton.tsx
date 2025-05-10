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
  // 正解ボタン判定
  const showCorrect = selected && choice === answer;
  // 不正解で自分が選んだボタン
  const showWrong = selected && choice === selected && choice !== answer;

  return (
    <Button
      fullWidth
      color={showCorrect ? 'green' : showWrong ? 'red' : selected ? 'gray' : 'blue'}
      variant={selected ? 'filled' : 'outline'}
      onClick={() => onSelect(choice)}
      disabled={disabled}
      style={{
        fontWeight: showCorrect ? 'bold' : undefined,
        // disabled時も色が分かるように背景色を強調
        ...(showCorrect && { backgroundColor: 'var(--mantine-color-green-6)', color: 'white' }),
        ...(showWrong && { backgroundColor: 'var(--mantine-color-red-6)', color: 'white' })
      }}
    >
      {choice}
    </Button>
  );
}
