import { Alert, Box, Button, Group, Stack, Textarea } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import { downloadText } from './api';
import type { LayoutOutput } from './types';

type Props = {
  output: LayoutOutput;
};

// 英訳・コンパイル結果の表示
export const OutputPanel = ({ output }: Props) => (
  <Stack>
    <Alert color='blue' variant='light'>
      {`生成時の画像サイズは ${output.width}×${output.height} を指定してください（プロンプトにはサイズが含まれません）`}
    </Alert>
    <Textarea
      label={
        <Group justify='space-between' mb={4}>
          <Box>MOSS-Image プロンプト（positive prompt に貼り付け）</Box>
          <ButtonCopy content={output.prompt} label='コピー' />
        </Group>
      }
      labelProps={{ w: '100%' }}
      autosize
      minRows={4}
      maxRows={12}
      value={output.prompt}
      readOnly
    />
    <Textarea
      label={
        <Group justify='space-between' mb={4}>
          <Box>ドラフト JSON（保存・再読み込み用）</Box>
          <Group gap='xs'>
            <Button
              variant='default'
              leftSection={<IconDownload size={16} />}
              onClick={() => downloadText(output.draftJson, `moss-layout-${output.width}x${output.height}.json`)}
            >
              保存
            </Button>
            <ButtonCopy content={output.draftJson} label='コピー' />
          </Group>
        </Group>
      }
      labelProps={{ w: '100%' }}
      autosize
      minRows={8}
      maxRows={24}
      value={output.draftJson}
      readOnly
    />
  </Stack>
);
