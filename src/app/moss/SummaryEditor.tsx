import { Paper, Select, SimpleGrid, Stack, TagsInput, Text, Textarea } from '@mantine/core';
import { PaletteInput } from './PaletteInput';
import { CANVAS_MODES, type CanvasMode, type EditorSummary } from './types';

const CANVAS_LABELS: Record<CanvasMode, string> = {
  single: '1枚絵（single）',
  multi_panel: '複数コマ（multi_panel）',
  collage: 'コラージュ（collage）'
};

const findCanvasMode = (v: string | null) => CANVAS_MODES.find((m) => m === v) ?? null;

type Props = {
  summary: EditorSummary;
  onChange: (patch: Partial<EditorSummary>, mergeKey: string) => void;
};

// 画像全体の設定（summary）の編集
export const SummaryEditor = ({ summary, onChange }: Props) => (
  <Paper withBorder p='sm'>
    <Stack gap='sm'>
      <Text fw='bold'>画像全体の設定</Text>
      <Textarea
        label='全体の説明（日本語でOK）'
        description='被写体・場面・媒体・ライティング・配色・ムード・背景など、画像全体の雰囲気'
        autosize
        minRows={3}
        maxRows={12}
        value={summary.caption}
        onChange={(e) => onChange({ caption: e.currentTarget.value }, 'summary:caption')}
      />
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TagsInput
          label='ジャンルタグ（任意）'
          placeholder='例: ポスター'
          value={summary.meta}
          onChange={(v) => onChange({ meta: v }, 'summary:meta')}
        />
        <Select
          label='画面の構成（任意）'
          placeholder='指定しない'
          clearable
          data={CANVAS_MODES.map((m) => ({ value: m, label: CANVAS_LABELS[m] }))}
          value={summary.canvas}
          onChange={(v) => onChange({ canvas: findCanvasMode(v) }, 'summary:canvas')}
        />
      </SimpleGrid>
      <PaletteInput
        label='全体の配色（任意）'
        value={summary.palette}
        onChange={(v) => onChange({ palette: v }, 'summary:palette')}
      />
    </Stack>
  </Paper>
);
