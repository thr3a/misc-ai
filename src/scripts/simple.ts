const debugApi2 = async (): Promise<void> => {
  const url = 'http://localhost:3000/api/simple/';
  const params = {
    message: 'やっほー',
    promptTemplate: [
      ['system', 'You are a helpful assistant.'],
      ['human', '{text}']
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
  await debugApi2();
})().catch(() => {});
