import { useCallback, useState } from 'react';

const LIMIT = 100;

type HistoryState<T> = { past: T[]; present: T; future: T[]; mergeKey: string | null };

// Undo/Redo 付きの状態。Mantine の useStateHistory は連続入力を 1 手にまとめられないため自前で実装している
// set に同じ mergeKey を連続で渡すと 1 つの履歴にまとめる（文字入力や矢印キーの連打用）
export const useHistory = <T>(initial: T) => {
  const [state, setState] = useState<HistoryState<T>>({ past: [], present: initial, future: [], mergeKey: null });

  const set = useCallback((updater: (prev: T) => T, mergeKey?: string) => {
    setState((s) => {
      const next = updater(s.present);
      if (Object.is(next, s.present)) return s;
      if (mergeKey && mergeKey === s.mergeKey) return { ...s, present: next, future: [] };
      return { past: [...s.past, s.present].slice(-LIMIT), present: next, future: [], mergeKey: mergeKey ?? null };
    });
  }, []);

  const undo = useCallback(() => {
    setState((s) => {
      if (s.past.length === 0) return s;
      return {
        past: s.past.slice(0, -1),
        present: s.past[s.past.length - 1],
        future: [s.present, ...s.future],
        mergeKey: null
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((s) => {
      if (s.future.length === 0) return s;
      return { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1), mergeKey: null };
    });
  }, []);

  const reset = useCallback((value: T) => {
    setState({ past: [], present: value, future: [], mergeKey: null });
  }, []);

  return {
    value: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0
  };
};
