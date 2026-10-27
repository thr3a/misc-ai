import {
  Badge,
  Button,
  Group,
  NavLink,
  NumberInput,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  TagsInput,
  Text,
  Textarea
} from '@mantine/core';
import { IconCopy, IconTrash } from '@tabler/icons-react';
import { LABEL_META } from './draft';
import { PaletteInput } from './PaletteInput';
import { type Bbox, type EditorItem, ITEM_LABELS, type ItemLabel } from './types';

const isItemLabel = (v: string): v is ItemLabel => ITEM_LABELS.some((l) => l === v);

type ListProps = {
  items: EditorItem[];
  selectedUid: string | null;
  issueUids: Set<string>;
  onSelect: (uid: string) => void;
};

// 要素一覧。重なって選びにくい要素もここから選択できる
export const ItemList = ({ items, selectedUid, issueUids, onSelect }: ListProps) => {
  if (items.length === 0) {
    return (
      <Text size='sm' c='dimmed'>
        要素がありません。上のボタンから追加してください
      </Text>
    );
  }
  return (
    <Stack gap={0}>
      {items.map((item, i) => (
        <NavLink
          key={item.uid}
          active={item.uid === selectedUid}
          onClick={() => onSelect(item.uid)}
          color={LABEL_META[item.label].color}
          leftSection={
            <Badge size='sm' color={LABEL_META[item.label].color} w={56}>
              {`${i + 1} ${LABEL_META[item.label].name}`}
            </Badge>
          }
          rightSection={
            issueUids.has(item.uid) ? (
              <Badge size='xs' color='yellow' variant='light'>
                要確認
              </Badge>
            ) : undefined
          }
          label={
            <Text size='sm' truncate='end'>
              {item.label === 'text' && item.text
                ? `「${item.text.replace(/\n/g, ' ')}」`
                : item.caption || '（説明なし）'}
            </Text>
          }
        />
      ))}
    </Stack>
  );
};

type EditorProps = {
  item: EditorItem;
  index: number;
  width: number;
  height: number;
  issues: string[];
  // mergeKey が同じ連続変更は 1 回の Undo にまとめられる
  onChange: (patch: Partial<EditorItem>, mergeKey: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

const BBOX_FIELDS: { key: keyof Bbox; label: string }[] = [
  { key: 'x1', label: '左 x1' },
  { key: 'y1', label: '上 y1' },
  { key: 'x2', label: '右 x2' },
  { key: 'y2', label: '下 y2' }
];

const percent = (v: number, total: number) => `${Math.round((v / total) * 1000) / 10}%`;

export const ItemEditor = ({ item, index, width, height, issues, onChange, onDuplicate, onDelete }: EditorProps) => {
  const w = item.bbox.x2 - item.bbox.x1;
  const h = item.bbox.y2 - item.bbox.y1;
  const key = (field: string) => `${field}:${item.uid}`;

  return (
    <Paper withBorder p='sm'>
      <Stack gap='sm'>
        <Group justify='space-between'>
          <Text fw='bold'>{`#${index + 1} の編集`}</Text>
          <Group gap='xs'>
            <Button size='xs' variant='default' leftSection={<IconCopy size={14} />} onClick={onDuplicate}>
              複製
            </Button>
            <Button size='xs' variant='light' color='red' leftSection={<IconTrash size={14} />} onClick={onDelete}>
              削除
            </Button>
          </Group>
        </Group>

        <SegmentedControl
          fullWidth
          value={item.label}
          color={LABEL_META[item.label].color}
          onChange={(v) => {
            if (isItemLabel(v)) onChange({ label: v }, key('label'));
          }}
          data={ITEM_LABELS.map((l) => ({ value: l, label: LABEL_META[l].name }))}
        />

        <Textarea
          label='見た目の説明（日本語でOK）'
          description={
            item.label === 'text' ? '書体・太さ・色・縁取りなど文字の見た目' : '形・色・素材・向き・状態など'
          }
          placeholder={item.label === 'text' ? '例: 赤い極太のゴシック体、白い縁取り' : '例: 湯気が立つ醤油ラーメン'}
          autosize
          minRows={3}
          maxRows={10}
          value={item.caption}
          onChange={(e) => onChange({ caption: e.currentTarget.value }, key('caption'))}
        />

        <Textarea
          label={item.label === 'text' ? '描画する文字' : '描画する文字（任意）'}
          description='画像に描く文字そのもの。翻訳されずそのまま出力されます'
          placeholder={item.label === 'text' ? '例: ラーメン500円' : ''}
          autosize
          minRows={item.label === 'text' ? 2 : 1}
          maxRows={8}
          value={item.text}
          onChange={(e) => onChange({ text: e.currentTarget.value }, key('text'))}
        />

        <Stack gap={4}>
          <SimpleGrid cols={4} spacing='xs'>
            {BBOX_FIELDS.map((f) => (
              <NumberInput
                key={f.key}
                size='xs'
                label={f.label}
                value={item.bbox[f.key]}
                min={0}
                max={f.key === 'x1' || f.key === 'x2' ? width : height}
                hideControls
                onChange={(v) => {
                  if (typeof v === 'number') onChange({ bbox: { ...item.bbox, [f.key]: v } }, key('bbox'));
                }}
              />
            ))}
          </SimpleGrid>
          <Text size='xs' c='dimmed'>
            {`位置 ${percent(item.bbox.x1, width)}, ${percent(item.bbox.y1, height)} / サイズ ${w}×${h}px（${percent(w, width)} × ${percent(h, height)}）`}
          </Text>
        </Stack>

        <TagsInput
          label='追加タグ（任意）'
          placeholder='入力して Enter'
          value={item.tags}
          onChange={(v) => onChange({ tags: v }, key('tags'))}
        />

        <PaletteInput
          label='要素の配色（任意）'
          value={item.palette}
          onChange={(v) => onChange({ palette: v }, key('palette'))}
        />

        {issues.length > 0 && (
          <Stack gap={2}>
            {issues.map((m) => (
              <Text key={m} size='xs' c='yellow.8'>
                {m}
              </Text>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
