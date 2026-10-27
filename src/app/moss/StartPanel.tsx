import {
  Alert,
  Button,
  FileButton,
  Group,
  JsonInput,
  Paper,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
  Textarea
} from '@mantine/core';
import { IconFileImport, IconLayoutBoard, IconSparkles, IconUpload } from '@tabler/icons-react';
import { useState } from 'react';
import { generateLayout, translateLayout } from './api';
import {
  draftToEditor,
  emptyLayout,
  type Orientation,
  parseDraftText,
  resolveSize,
  SIZE_PRESETS,
  sizeLabel
} from './draft';
import type { EditorLayout, ModelId } from './types';

type Props = {
  model: ModelId;
  onStart: (layout: EditorLayout) => void;
};

const DEFAULT_PROMPT =
  '杞憂堂というラーメン屋のラーメン500円キャンペーンのポスター作って\n500円の文字は大きく赤 醤油ラーメンで湯気が出ている 人はいない';

const isOrientation = (v: string): v is Orientation => v === 'landscape' || v === 'portrait';

// 解像度の選択
const SizeSelector = ({
  ratio,
  orientation,
  onChangeRatio,
  onChangeOrientation
}: {
  ratio: string;
  orientation: Orientation;
  onChangeRatio: (v: string) => void;
  onChangeOrientation: (v: Orientation) => void;
}) => {
  const { width, height } = resolveSize(ratio, orientation);
  return (
    <Stack gap='xs'>
      <Text size='sm' fw='bold'>
        解像度
      </Text>
      <Group gap='sm'>
        <SegmentedControl
          value={ratio}
          onChange={onChangeRatio}
          data={SIZE_PRESETS.map((p) => ({ value: p.ratio, label: p.ratio }))}
        />
        <SegmentedControl
          value={ratio === '1:1' ? 'landscape' : orientation}
          disabled={ratio === '1:1'}
          onChange={(v) => {
            if (isOrientation(v)) onChangeOrientation(v);
          }}
          data={[
            { value: 'landscape', label: '横長' },
            { value: 'portrait', label: '縦長' }
          ]}
        />
      </Group>
      <Text size='sm' c='dimmed'>
        {`${sizeLabel(width, height)}　※作成後は変更できません`}
      </Text>
    </Stack>
  );
};

// 開始画面。AI で生成 / JSON を読み込む / 空のキャンバスから作る
export const StartPanel = ({ model, onStart }: Props) => {
  const [tab, setTab] = useState<string | null>('ai');
  const [ratio, setRatio] = useState<string>(SIZE_PRESETS[0].ratio);
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [json, setJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { width, height } = resolveSize(ratio, orientation);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    const layout = await generateLayout(model, prompt, width, height);
    setLoading(false);
    if (!layout) {
      setError('レイアウトの生成に失敗しました。もう一度試してください');
      return;
    }
    onStart(layout);
  };

  const handleImport = async () => {
    setError('');
    const result = parseDraftText(json);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLoading(true);
    const layout = await translateLayout(draftToEditor(result.draft), 'ja', model);
    setLoading(false);
    if (!layout) {
      setError('日本語への翻訳に失敗しました。もう一度試してください');
      return;
    }
    onStart(layout);
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setJson(await file.text());
    setError('');
  };

  const sizeSelector = (
    <SizeSelector
      ratio={ratio}
      orientation={orientation}
      onChangeRatio={setRatio}
      onChangeOrientation={setOrientation}
    />
  );

  return (
    <Paper withBorder p='md'>
      <Tabs
        value={tab}
        onChange={(v) => {
          setTab(v);
          setError('');
        }}
      >
        <Tabs.List mb='md'>
          <Tabs.Tab value='ai' leftSection={<IconSparkles size={16} />}>
            AIで作成
          </Tabs.Tab>
          <Tabs.Tab value='import' leftSection={<IconFileImport size={16} />}>
            JSONを読み込む
          </Tabs.Tab>
          <Tabs.Tab value='blank' leftSection={<IconLayoutBoard size={16} />}>
            空のキャンバス
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value='ai'>
          <Stack>
            {sizeSelector}
            <Textarea
              label='どんな画像にしたいか（日本語）'
              description='描画したい文字・色・配置・入れたくないものなどを自由に書いてください'
              autosize
              minRows={4}
              maxRows={12}
              value={prompt}
              onChange={(e) => setPrompt(e.currentTarget.value)}
            />
            <Group justify='flex-end'>
              <Button onClick={handleGenerate} loading={loading} disabled={!prompt.trim()}>
                レイアウトを作成
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value='import'>
          <Stack>
            <Text size='sm' c='dimmed'>
              width / height 付きのドラフト JSON（bbox_coord_space: abs）を読み込みます。解像度は JSON
              の値を使います。説明文は日本語に翻訳して読み込みます。
            </Text>
            <JsonInput
              label='ドラフト JSON'
              placeholder='{"width": 1024, "height": 1024, "bbox_coord_space": "abs", ...}'
              autosize
              minRows={8}
              maxRows={20}
              value={json}
              onChange={setJson}
            />
            <Group justify='space-between'>
              <FileButton onChange={handleFile} accept='application/json,.json,.txt'>
                {(props) => (
                  <Button {...props} variant='default' leftSection={<IconUpload size={16} />}>
                    ファイルを選択
                  </Button>
                )}
              </FileButton>
              <Button onClick={handleImport} loading={loading} disabled={!json.trim()}>
                読み込む
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value='blank'>
          <Stack>
            {sizeSelector}
            <Group justify='flex-end'>
              <Button onClick={() => onStart(emptyLayout(width, height))}>空のキャンバスで始める</Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {error && (
        <Alert color='red' mt='md' style={{ whiteSpace: 'pre-wrap' }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
};
