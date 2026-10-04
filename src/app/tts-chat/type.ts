// 複数のファイルから参照されるtypesはここに書く

export type SpeechMode = 'voice' | 'caption';

export type SpeechSettings = {
  mode: SpeechMode;
  voiceId: string;
  caption: string;
  // 再生速度。音声生成には使わず、ブラウザ側の再生時に適用する
  playbackRate: number;
};

export type SpeechRequestBody = {
  input: string;
  settings: SpeechSettings;
};

export type SpeechControl = {
  playingId: string | null;
  loadingIds: string[];
  onPlay: (messageId: string, text: string) => void;
  onStop: () => void;
};
