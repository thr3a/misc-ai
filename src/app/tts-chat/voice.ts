import type { SpeechSettings } from './type';

// Irodori-TTS サーバーにアップロード済みの voice ID 一覧
export const voiceOptions = [{ value: 'tobari1', label: 'tobari1' }];

export const defaultSpeechSettings: SpeechSettings = {
  mode: 'voice',
  voiceId: 'tobari1',
  caption: '',
  playbackRate: 1.2
};
