const debug4 = async (): Promise<void> => {
  const url = 'http://localhost:3000/api/chat-stream/';
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
  const stream = res.body;
  const reader = stream?.getReader();
  const decoder = new TextDecoder('utf-8');
  try {
    while (true) {
      const { done, value }: any = await reader?.read();
      if (done === true) {
        break;
      }
      const decodedValue = decoder.decode(value, { stream: true });
      console.log(decodedValue);
    }
  } catch (error) {
    console.error(error);
  } finally {
    reader?.releaseLock();
  }
};
(async () => {
  await debug4();
})().catch(() => {});
