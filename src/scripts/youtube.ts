import { type Caption, Client } from 'youtubei';

const youtube = new Client({
  youtubeClientOptions: {
    hl: 'ja',
    gl: 'ja'
  }
});
const run = async () => {
  const video = await youtube.getVideo('c_8n5C5mBuU');

  const captions = (await video?.captions?.get('ja')) || ([] as Caption[]);
  console.log(
    captions
      .map((x) => x.text)
      .join('')
      .replaceAll(/[\n|,]/g, '')
  );
};

run();
