const debug = async (): Promise<void> => {
  const url = 'http://localhost:3000/api/chat-stream/';
  const params = {
    systemMessage: '以下は私とあなたとの会話です。',
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
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
  if (res.body === null) throw new Error('res.body is null');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    process.stdout.write(decoder.decode(value, { stream: true }));
  }
};
(async () => {
  await debug();
})();

export {};
