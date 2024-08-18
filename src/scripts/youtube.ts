import { YoutubeTranscript } from 'youtube-transcript';

YoutubeTranscript.fetchTranscript('https://www.youtube.com/watch?v=c_8n5C5mBuU&t=61s', { lang: 'ja' }).then(
  console.log
);
