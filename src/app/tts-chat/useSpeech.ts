import { useCallback, useEffect, useRef, useState } from 'react';
import type { SpeechRequestBody, SpeechSettings } from './type';

const fetchSpeechUrl = async (body: SpeechRequestBody) => {
  const res = await fetch('/api/tts-chat/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null);
    const message =
      typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
        ? data.error
        : '音声生成に失敗しました';
    throw new Error(message);
  }
  return URL.createObjectURL(await res.blob());
};

// 生成済み音声をメッセージIDごとに保持し、常に1つだけ再生する
export const useSpeech = (settings: SpeechSettings) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlsRef = useRef(new Map<string, string>());
  // 再生要求ごとに増やし、古い要求の音声が後から鳴らないようにする
  const requestIdRef = useRef(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingId(null);
  }, []);

  const play = useCallback(
    async (messageId: string, text: string) => {
      stop();
      const requestId = requestIdRef.current;
      setError(null);

      let url = urlsRef.current.get(messageId);
      if (!url) {
        setLoadingIds((ids) => [...ids, messageId]);
        try {
          url = await fetchSpeechUrl({ input: text, settings });
          urlsRef.current.set(messageId, url);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
          return;
        } finally {
          setLoadingIds((ids) => ids.filter((id) => id !== messageId));
        }
      }
      if (requestId !== requestIdRef.current) return;

      const audio = new Audio(url);
      audio.playbackRate = settings.playbackRate;
      audio.onended = () => {
        if (audioRef.current !== audio) return;
        audioRef.current = null;
        setPlayingId(null);
      };
      audioRef.current = audio;
      setPlayingId(messageId);
      await audio.play().catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
        setPlayingId(null);
      });
    },
    [settings, stop]
  );

  // 再生中に速度を変えた場合も即座に反映する
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = settings.playbackRate;
  }, [settings.playbackRate]);

  const reset = useCallback(() => {
    stop();
    for (const url of urlsRef.current.values()) URL.revokeObjectURL(url);
    urlsRef.current.clear();
    setError(null);
  }, [stop]);

  useEffect(() => reset, [reset]);

  return { play, stop, reset, playingId, loadingIds, error };
};
