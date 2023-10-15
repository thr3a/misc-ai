const listParse = async (): Promise<void> => {
  const url = 'http://localhost:3000/api/list-parser/';
  const params = {
    prompt: 'アイスクリームの味を5つ列挙してください。'
  };
  const body = JSON.stringify(params);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body
  });
  const data = await res.json();
  console.log(data);
};

(async () => {
  await listParse();
})().catch(() => {});
