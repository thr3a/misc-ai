const debugApi = async (): Promise<void> => {
  const url = 'http://localhost:3000/api/siritori/';
  const params = {
    word: 'やっほー',
    history: [
      {
        body: 'こんにちは',
        role: 'human'
      },
      {
        body: 'こんにちは！',
        role: 'ai'
      },
      {
        body: '私は田中です。',
        role: 'human'
      },
      {
        body: 'あなたは女性ですか？',
        role: 'ai'
      },
      {
        body: 'いいえ',
        role: 'human'
      }
    ]
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
  await debugApi();
})().catch(() => {});
