import { getYouTubeTranscript } from '@/app/api/youtube/util';

const run = async () => {
  const transcript = await getYouTubeTranscript('https://www.youtube.com/watch?v=c_8n5C5mBuU');
  console.log(transcript);
};

run();
