// import fetch from 'node-fetch';

async function fetchLyric(url: string) {
  const encodedUrl = encodeURIComponent(url);
  const apiUrl = `https://franks543-lyric-get.vercel.app/api/lyric/get/${encodedUrl}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching the lyric:', error);
    throw error;
  }
}

// 使用例
fetchLyric('https://www.uta-net.com/song/252556/')
  .then((data) => console.log(data))
  .catch((error) => console.error(error));
