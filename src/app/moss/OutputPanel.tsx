import { Alert, Box, Button, Group, Input, SegmentedControl, Stack, Textarea } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { IconDownload } from '@tabler/icons-react';
import { useMemo } from 'react';
import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import { downloadText } from './api';
import { compileDraft, formatDraft, isOutputScale, type OutputScale, outputSize, scaleDraft } from './draft';
import type { LayoutOutput } from './types';

type Props = {
  output: LayoutOutput;
};

// 英訳・コンパイル結果の表示。編集は 1MP で行い、ここで選んだ解像度に bbox を拡大して出力する
export const OutputPanel = ({ output }: Props) => {
  const [scale, setScale] = useLocalStorage<OutputScale>({ key: 'moss-output-scale', defaultValue: '1mp' });

  const { prompt, draftJson, width, height } = useMemo(() => {
    const size = outputSize(output.draft.width, output.draft.height, scale);
    const draft = scaleDraft(output.draft, size.width, size.height);
    return { prompt: compileDraft(draft), draftJson: formatDraft(draft), width: size.width, height: size.height };
  }, [output, scale]);

  const base = output.draft;
  const large = outputSize(base.width, base.height, '2mp');

  return (
    <Stack>
      <Input.Wrapper label='出力解像度'>
        <Box>
          <SegmentedControl
            value={scale}
            onChange={(v) => {
              if (isOutputScale(v)) setScale(v);
            }}
            data={[
              { value: '1mp', label: `1MP（${base.width}×${base.height}）` },
              { value: '2mp', label: `2MP（${large.width}×${large.height}）` }
            ]}
          />
        </Box>
      </Input.Wrapper>
      <Alert color='blue' variant='light'>
        {`生成時の画像サイズは ${width}×${height} を指定してください（プロンプトにはサイズが含まれません）`}
      </Alert>
      <Textarea
        label={
          <Group justify='space-between' mb={4}>
            <Box>MOSS-Image プロンプト（positive prompt に貼り付け）</Box>
            <ButtonCopy content={prompt} label='コピー' />
          </Group>
        }
        labelProps={{ w: '100%' }}
        autosize
        minRows={4}
        maxRows={12}
        value={prompt}
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
                onClick={() => downloadText(draftJson, `moss-layout-${width}x${height}.json`)}
              >
                保存
              </Button>
              <ButtonCopy content={draftJson} label='コピー' />
            </Group>
          </Group>
        }
        labelProps={{ w: '100%' }}
        autosize
        minRows={8}
        maxRows={24}
        value={draftJson}
        readOnly
      />
    </Stack>
  );
};
