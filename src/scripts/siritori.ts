const debugApi = async (): Promise<void> => {
  const url = 'http://localhost:3000/api/mhiss/';
  const params = {
    systemMessage: '私の雑談相手になってください。',
    message: '私について知っている事をすべて教えてください。',
    history: [
      {
        body: '私は25歳の田中です。',
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
