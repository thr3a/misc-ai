import { alpha, Box, Text } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { HEX_COLOR, LABEL_META, moveBbox } from './draft';
import type { Bbox, EditorLayout } from './types';

type Handle = 'move' | 'nw' | 'ne' | 'sw' | 'se';

type DragState = {
  uid: string;
  handle: Handle;
  startX: number;
  startY: number;
  origin: Bbox;
  // 画面上の 1px がキャンバス上の何 px にあたるか
  scale: number;
};

type Props = {
  layout: EditorLayout;
  selectedUid: string | null;
  onSelect: (uid: string | null) => void;
  onChangeBbox: (uid: string, bbox: Bbox) => void;
};

const MIN_SIZE = 16;
const HANDLES: Handle[] = ['nw', 'ne', 'sw', 'se'];
const HANDLE_SIZE = 12;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

// ドラッグ量（キャンバス px）を bbox に反映する。キャンバス内に収め、最小サイズを保つ
const applyDrag = (origin: Bbox, handle: Handle, dx: number, dy: number, width: number, height: number): Bbox => {
  if (handle === 'move') return moveBbox(origin, Math.round(dx), Math.round(dy), width, height);
  const west = handle === 'nw' || handle === 'sw';
  const north = handle === 'nw' || handle === 'ne';
  return {
    x1: west ? clamp(Math.round(origin.x1 + dx), 0, origin.x2 - MIN_SIZE) : origin.x1,
    x2: west ? origin.x2 : clamp(Math.round(origin.x2 + dx), origin.x1 + MIN_SIZE, width),
    y1: north ? clamp(Math.round(origin.y1 + dy), 0, origin.y2 - MIN_SIZE) : origin.y1,
    y2: north ? origin.y2 : clamp(Math.round(origin.y2 + dy), origin.y1 + MIN_SIZE, height)
  };
};

const sameBbox = (a: Bbox, b: Bbox) => a.x1 === b.x1 && a.y1 === b.y1 && a.x2 === b.x2 && a.y2 === b.y2;

// 不正な bbox（x1 > x2 など）でも描画できるよう正規化してパーセントにする
const toPercentRect = (b: Bbox, width: number, height: number) => {
  const left = Math.min(b.x1, b.x2);
  const top = Math.min(b.y1, b.y2);
  return {
    left: `${(left / width) * 100}%`,
    top: `${(top / height) * 100}%`,
    width: `${(Math.abs(b.x2 - b.x1) / width) * 100}%`,
    height: `${(Math.abs(b.y2 - b.y1) / height) * 100}%`
  };
};

// 文字プレビューの 1em（キャンバス px）
const textEm = (b: Bbox, text: string) => (Math.abs(b.y2 - b.y1) / text.split('\n').length) * 0.55;

const labelColor = (color: string) => `var(--mantine-color-${color}-6)`;

export const LayoutCanvas = ({ layout, selectedUid, onSelect, onChangeBbox }: Props) => {
  const { width, height } = layout;
  const containerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<Bbox | null>(null);
  // ドラッグ中に親が再描画されても最新値を失わないよう ref で保持する
  const latestRef = useRef<Bbox | null>(null);
  const onChangeRef = useRef(onChangeBbox);
  onChangeRef.current = onChangeBbox;

  useEffect(() => {
    if (!drag) return;
    const handleMove = (e: PointerEvent) => {
      const dx = (e.clientX - drag.startX) * drag.scale;
      const dy = (e.clientY - drag.startY) * drag.scale;
      const next = applyDrag(drag.origin, drag.handle, dx, dy, width, height);
      latestRef.current = next;
      setPreview(next);
    };
    const handleUp = () => {
      const latest = latestRef.current;
      if (latest && !sameBbox(latest, drag.origin)) onChangeRef.current(drag.uid, latest);
      latestRef.current = null;
      setDrag(null);
      setPreview(null);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [drag, width, height]);

  const startDrag = (e: React.PointerEvent, uid: string, handle: Handle) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    // 入力欄にフォーカスが残ると矢印キーや Ctrl+Z がキャンバスに効かないため外す
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    onSelect(uid);
    const rect = containerRef.current?.getBoundingClientRect();
    const item = layout.items.find((i) => i.uid === uid);
    if (!rect || !item || rect.width === 0) return;
    latestRef.current = item.bbox;
    setPreview(item.bbox);
    setDrag({ uid, handle, startX: e.clientX, startY: e.clientY, origin: item.bbox, scale: width / rect.width });
  };

  const bboxOf = (uid: string, bbox: Bbox) => (drag?.uid === uid && preview ? preview : bbox);

  // 小さい要素ほど前面に出して、重なっていても選びやすくする
  const ordered = layout.items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        Math.abs((b.item.bbox.x2 - b.item.bbox.x1) * (b.item.bbox.y2 - b.item.bbox.y1)) -
        Math.abs((a.item.bbox.x2 - a.item.bbox.x1) * (a.item.bbox.y2 - a.item.bbox.y1))
    );

  const selected = layout.items.find((i) => i.uid === selectedUid);
  const selectedBbox = selected ? bboxOf(selected.uid, selected.bbox) : null;

  return (
    // 縦長キャンバスでも画面に収まるよう、高さ 70vh 相当を上限に幅を決める
    <Box w='100%' maw={`calc(70vh * ${width / height})`} mx='auto'>
      <Box
        ref={containerRef}
        pos='relative'
        w='100%'
        bg='gray.0'
        bd='1px solid var(--mantine-color-gray-4)'
        style={{
          aspectRatio: `${width} / ${height}`,
          touchAction: 'none',
          userSelect: 'none',
          // 文字プレビューの大きさをキャンバス幅基準（cqw）で指定するため
          containerType: 'inline-size',
          backgroundImage:
            'linear-gradient(var(--mantine-color-gray-2) 1px, transparent 1px), linear-gradient(90deg, var(--mantine-color-gray-2) 1px, transparent 1px)',
          backgroundSize: `${(64 / width) * 100}% ${(64 / height) * 100}%`
        }}
        onPointerDown={() => onSelect(null)}
      >
        {ordered.map(({ item, index }, order) => {
          const color = labelColor(LABEL_META[item.label].color);
          const isSelected = item.uid === selectedUid;
          const b = bboxOf(item.uid, item.bbox);
          return (
            <Box
              key={item.uid}
              pos='absolute'
              style={{
                ...toPercentRect(b, width, height),
                zIndex: order + 1,
                border: `2px ${isSelected ? 'solid' : 'dashed'} ${color}`,
                background: alpha(color, isSelected ? 0.22 : 0.08),
                cursor: drag ? 'grabbing' : 'move',
                overflow: 'hidden',
                boxShadow: isSelected ? `0 0 0 2px ${alpha(color, 0.35)}` : undefined
              }}
              onPointerDown={(e) => startDrag(e, item.uid, 'move')}
            >
              <Text
                size='xs'
                c='white'
                bg={color}
                px={4}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', lineHeight: 1.5, zIndex: 1 }}
              >
                {`${index + 1} ${LABEL_META[item.label].name}`}
              </Text>
              <Box
                w='100%'
                h='100%'
                p={4}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  overflow: 'hidden'
                }}
              >
                {item.label === 'text' && item.text ? (
                  // 文字の大きさの目安（1 行の文字高 ≒ bbox の高さ × 0.55）でプレビューする
                  <Text
                    ta='center'
                    fw='bold'
                    c={item.palette.find((c) => HEX_COLOR.test(c)) ?? 'dark.6'}
                    style={{
                      fontSize: `${(textEm(b, item.text) / width) * 100}cqw`,
                      lineHeight: 1.2,
                      // 淡い色の文字でも背景に埋もれないよう縁取る
                      textShadow: '0 0 1px rgba(0, 0, 0, 0.8), 0 0 3px rgba(0, 0, 0, 0.3)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}
                  >
                    {item.text}
                  </Text>
                ) : (
                  <Text size='xs' c='dimmed' ta='center' lineClamp={3} pt='md'>
                    {item.caption}
                  </Text>
                )}
              </Box>
            </Box>
          );
        })}

        {selected && selectedBbox && (
          <>
            {HANDLES.map((handle) => {
              const x = handle === 'nw' || handle === 'sw' ? selectedBbox.x1 : selectedBbox.x2;
              const y = handle === 'nw' || handle === 'ne' ? selectedBbox.y1 : selectedBbox.y2;
              return (
                <Box
                  key={handle}
                  pos='absolute'
                  w={HANDLE_SIZE}
                  h={HANDLE_SIZE}
                  bg='white'
                  style={{
                    left: `${(x / width) * 100}%`,
                    top: `${(y / height) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    border: `2px solid ${labelColor(LABEL_META[selected.label].color)}`,
                    cursor: handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize',
                    zIndex: layout.items.length + 10,
                    touchAction: 'none'
                  }}
                  onPointerDown={(e) => startDrag(e, selected.uid, handle)}
                />
              );
            })}
            {drag && (
              <Text
                size='xs'
                c='white'
                bg='dark.6'
                px={6}
                style={{
                  position: 'absolute',
                  left: `${(Math.min(selectedBbox.x1, selectedBbox.x2) / width) * 100}%`,
                  top: `${(Math.max(selectedBbox.y1, selectedBbox.y2) / height) * 100}%`,
                  zIndex: layout.items.length + 11,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                {`${selectedBbox.x1}, ${selectedBbox.y1} / ${selectedBbox.x2 - selectedBbox.x1}×${selectedBbox.y2 - selectedBbox.y1}`}
              </Text>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};
