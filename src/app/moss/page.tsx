'use client';

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Divider,
  FileButton,
  Grid,
  Group,
  List,
  Modal,
  Radio,
  Stack,
  Text,
  Tooltip
} from '@mantine/core';
import { type HotkeyItem, useDisclosure, useHotkeys } from '@mantine/hooks';
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconDeviceFloppy,
  IconFolderOpen,
  IconLanguage,
  IconPlus,
  IconRefresh
} from '@tabler/icons-react';
import { useCallback, useMemo, useState } from 'react';
import { downloadText, translateLayout } from './api';
import {
  checkDraft,
  compileDraft,
  createItem,
  duplicateItem,
  editorToDraft,
  formatDraft,
  LABEL_META,
  moveBbox,
  sizeLabel,
  validateLayout
} from './draft';
import { ItemEditor, ItemList } from './ItemEditor';
import { LayoutCanvas } from './LayoutCanvas';
import { OutputPanel } from './OutputPanel';
import { StartPanel } from './StartPanel';
import { SummaryEditor } from './SummaryEditor';
import {
  type Bbox,
  type EditorItem,
  type EditorLayout,
  type EditorSummary,
  ITEM_LABELS,
  type ItemLabel,
  type LayoutOutput,
  type ModelId
} from './types';
import { useHistory } from './useHistory';
import { parseWorkText, serializeWork } from './work';

const MODELS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'local', label: 'ローカルLLM' }
];

// 関数名は変えないこと
export default function Page() {
  const [model, setModel] = useState<ModelId>('openai');
  const history = useHistory<EditorLayout | null>(null);
  const layout = history.value;
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [output, setOutput] = useState<LayoutOutput | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [resetOpened, resetModal] = useDisclosure(false);
  const [workError, setWorkError] = useState('');

  const { set: setHistory } = history;
  const updateLayout = useCallback(
    (fn: (l: EditorLayout) => EditorLayout, mergeKey?: string) =>
      setHistory((prev) => (prev ? fn(prev) : prev), mergeKey),
    [setHistory]
  );

  const updateItem = useCallback(
    (uid: string, fn: (item: EditorItem) => EditorItem, mergeKey?: string) =>
      updateLayout((l) => ({ ...l, items: l.items.map((i) => (i.uid === uid ? fn(i) : i)) }), mergeKey),
    [updateLayout]
  );

  const handleChangeBbox = useCallback(
    (uid: string, bbox: Bbox) => updateItem(uid, (i) => ({ ...i, bbox })),
    [updateItem]
  );

  // Undo で消えた要素を選択したままにしない
  const selectedIndex = layout ? layout.items.findIndex((i) => i.uid === selectedUid) : -1;
  const selected = layout && selectedIndex >= 0 ? layout.items[selectedIndex] : null;

  const issues = useMemo(() => (layout ? validateLayout(layout) : []), [layout]);
  const issueUids = useMemo(() => new Set(issues.flatMap((i) => (i.uid ? [i.uid] : []))), [issues]);

  const handleStart = (next: EditorLayout) => {
    history.reset(next);
    setSelectedUid(null);
    setOutput(null);
    setExportError('');
  };

  const handleReset = () => {
    history.reset(null);
    setSelectedUid(null);
    setOutput(null);
    setExportError('');
    resetModal.close();
  };

  const handleSaveWork = () => {
    if (!layout) return;
    const { content, filename } = serializeWork(layout);
    downloadText(content, filename);
  };

  // 読み込みも履歴に積むので、誤って開いても Undo で戻せる
  const handleOpenWork = async (file: File | null) => {
    if (!file) return;
    const result = parseWorkText(await file.text());
    if (!result.ok) {
      setWorkError(result.error);
      return;
    }
    setHistory(() => result.layout);
    setSelectedUid(null);
    setOutput(null);
    setExportError('');
    setWorkError('');
  };

  const handleAdd = (label: ItemLabel) => {
    if (!layout) return;
    const item = createItem(label, layout.width, layout.height);
    updateLayout((l) => ({ ...l, items: [...l.items, item] }));
    setSelectedUid(item.uid);
  };

  const handleDuplicate = () => {
    if (!layout || !selected) return;
    const copy = duplicateItem(selected, layout.width, layout.height);
    updateLayout((l) => {
      const index = l.items.findIndex((i) => i.uid === selected.uid);
      return { ...l, items: [...l.items.slice(0, index + 1), copy, ...l.items.slice(index + 1)] };
    });
    setSelectedUid(copy.uid);
  };

  const handleDelete = () => {
    if (!selected) return;
    updateLayout((l) => ({ ...l, items: l.items.filter((i) => i.uid !== selected.uid) }));
    setSelectedUid(null);
  };

  const nudge = (dx: number, dy: number) => {
    if (!selected) return;
    updateItem(
      selected.uid,
      (i) => (layout ? { ...i, bbox: moveBbox(i.bbox, dx, dy, layout.width, layout.height) } : i),
      `nudge:${selected.uid}`
    );
  };

  // 入力欄にフォーカスがあるときは useHotkeys が無視するため、テキストの Undo とは衝突しない
  const hotkeys: HotkeyItem[] = layout
    ? [
        ['mod+Z', history.undo],
        ['mod+shift+Z', history.redo],
        ['mod+Y', history.redo]
      ]
    : [];
  if (selected) {
    hotkeys.push(
      ['ArrowUp', () => nudge(0, -1)],
      ['ArrowDown', () => nudge(0, 1)],
      ['ArrowLeft', () => nudge(-1, 0)],
      ['ArrowRight', () => nudge(1, 0)],
      ['shift+ArrowUp', () => nudge(0, -10)],
      ['shift+ArrowDown', () => nudge(0, 10)],
      ['shift+ArrowLeft', () => nudge(-10, 0)],
      ['shift+ArrowRight', () => nudge(10, 0)],
      ['Escape', () => setSelectedUid(null)]
    );
  }
  useHotkeys(hotkeys);

  const handleExport = async () => {
    if (!layout) return;
    setExportError('');
    if (issues.length > 0) {
      setExportError('未入力やはみ出しがあります。下の「要確認」を解消してください');
      return;
    }
    setExporting(true);
    const english = await translateLayout(layout, 'en', model);
    setExporting(false);
    if (!english) {
      setExportError('英語への翻訳に失敗しました。もう一度試してください');
      return;
    }
    const draft = editorToDraft(english);
    const error = checkDraft(draft);
    if (error) {
      setExportError(`ドラフトの検証に失敗しました\n${error}`);
      return;
    }
    setOutput({
      prompt: compileDraft(draft),
      draftJson: formatDraft(draft),
      width: draft.width,
      height: draft.height
    });
  };

  return (
    <Stack>
      <Radio.Group
        label='AIモデル'
        value={model}
        onChange={(v) => {
          if (v === 'openai' || v === 'local') setModel(v);
        }}
      >
        <Group mt='xs'>
          {MODELS.map((m) => (
            <Radio key={m.value} value={m.value} label={m.label} />
          ))}
        </Group>
      </Radio.Group>

      {!layout && <StartPanel model={model} onStart={handleStart} />}

      {layout && (
        <>
          <Group justify='space-between'>
            <Group gap='xs'>
              <Badge variant='light' size='lg' tt='none'>
                {sizeLabel(layout.width, layout.height)}
              </Badge>
              <Tooltip label='元に戻す（Ctrl+Z）'>
                <ActionIcon variant='default' size='lg' onClick={history.undo} disabled={!history.canUndo}>
                  <IconArrowBackUp size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label='やり直す（Ctrl+Shift+Z）'>
                <ActionIcon variant='default' size='lg' onClick={history.redo} disabled={!history.canRedo}>
                  <IconArrowForwardUp size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Group gap='xs'>
              <Button variant='default' leftSection={<IconDeviceFloppy size={16} />} onClick={handleSaveWork}>
                作業を保存
              </Button>
              <FileButton onChange={handleOpenWork} accept='application/json,.json'>
                {(props) => (
                  <Button {...props} variant='default' leftSection={<IconFolderOpen size={16} />}>
                    作業を開く
                  </Button>
                )}
              </FileButton>
              <Button variant='default' color='red' leftSection={<IconRefresh size={16} />} onClick={resetModal.open}>
                新規作成
              </Button>
            </Group>
          </Group>

          {workError && (
            <Alert color='red' withCloseButton onClose={() => setWorkError('')} style={{ whiteSpace: 'pre-wrap' }}>
              {workError}
            </Alert>
          )}

          <Grid>
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Stack gap='xs'>
                <Group gap='xs'>
                  {ITEM_LABELS.map((label) => (
                    <Button
                      key={label}
                      size='xs'
                      variant='light'
                      color={LABEL_META[label].color}
                      leftSection={<IconPlus size={14} />}
                      onClick={() => handleAdd(label)}
                    >
                      {LABEL_META[label].name}
                    </Button>
                  ))}
                </Group>
                <LayoutCanvas
                  layout={layout}
                  selectedUid={selected?.uid ?? null}
                  onSelect={setSelectedUid}
                  onChangeBbox={handleChangeBbox}
                />
                <Text size='xs' c='dimmed'>
                  ドラッグで移動、四隅で大きさを変更。選択中は矢印キーで 1px（Shift で 10px）移動
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Stack gap='sm'>
                <ItemList
                  items={layout.items}
                  selectedUid={selected?.uid ?? null}
                  issueUids={issueUids}
                  onSelect={setSelectedUid}
                />
                {selected ? (
                  <ItemEditor
                    key={selected.uid}
                    item={selected}
                    index={selectedIndex}
                    width={layout.width}
                    height={layout.height}
                    issues={issues.filter((i) => i.uid === selected.uid).map((i) => i.message)}
                    onChange={(patch, mergeKey) => updateItem(selected.uid, (i) => ({ ...i, ...patch }), mergeKey)}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                ) : (
                  layout.items.length > 0 && (
                    <Text size='sm' c='dimmed'>
                      ボックスをクリックすると、ここで内容を編集できます
                    </Text>
                  )
                )}
              </Stack>
            </Grid.Col>
          </Grid>

          <SummaryEditor
            summary={layout.summary}
            onChange={(patch: Partial<EditorSummary>, mergeKey) =>
              updateLayout((l) => ({ ...l, summary: { ...l.summary, ...patch } }), mergeKey)
            }
          />

          {issues.length > 0 && (
            <Alert color='yellow' title='要確認'>
              <List size='sm'>
                {issues.map((issue, i) => (
                  <List.Item key={`${issue.uid}-${i}`}>
                    {issue.uid ? (
                      <Text
                        size='sm'
                        span
                        td='underline'
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedUid(issue.uid)}
                      >
                        {issue.message}
                      </Text>
                    ) : (
                      issue.message
                    )}
                  </List.Item>
                ))}
              </List>
            </Alert>
          )}

          <Divider label='出力' labelPosition='center' />

          <Group justify='center'>
            <Button size='md' leftSection={<IconLanguage size={18} />} onClick={handleExport} loading={exporting}>
              英語に変換して出力
            </Button>
          </Group>

          {exportError && (
            <Alert color='red' style={{ whiteSpace: 'pre-wrap' }}>
              {exportError}
            </Alert>
          )}

          {output && <OutputPanel output={output} />}
        </>
      )}

      <Modal opened={resetOpened} onClose={resetModal.close} title='新規作成'>
        <Stack>
          <Text size='sm'>現在のレイアウトを破棄して、最初からやり直しますか？</Text>
          <Group justify='flex-end'>
            <Button variant='default' onClick={resetModal.close}>
              キャンセル
            </Button>
            <Button color='red' onClick={handleReset}>
              破棄して新規作成
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
