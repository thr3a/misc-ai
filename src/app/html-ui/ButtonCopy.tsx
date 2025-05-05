// ソースコードをコピーするボタンコンポーネント
import { Button } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { IconCheck, IconCopy } from '@tabler/icons-react';

type Props = {
  content: string;
  label?: string;
};

/**
 * ソースコードなどのテキストをクリップボードにコピーするボタン
 * @param content コピーする内容
 * @param label ボタンに表示するラベル（省略時はアイコンのみ）
 * @example
 * <ButtonCopy content="内容" label="コピー" />
 * <ButtonCopy content="内容" /> // アイコンのみ
 */
export function ButtonCopy({ content, label }: Props) {
  // クリップボード操作用のフック
  const clipboard = useClipboard({ timeout: 500 });
  // コピー済みならチェックアイコン、未コピーならコピーアイコン
  const icon = clipboard.copied ? <IconCheck size={20} stroke={1.5} /> : <IconCopy size={20} stroke={1.5} />;

  return (
    <Button
      variant='light'
      onClick={() => clipboard.copy(content)}
      color={clipboard.copied ? 'teal' : 'blue'}
      {...(label ? { rightSection: icon } : {})}
    >
      {label ? label : icon}
    </Button>
  );
}
