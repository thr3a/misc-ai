import { type RequestProps } from '@/app/api/chat-stream/route';
const topic = 'vim vs emacs';

const promptA = `
あなたには計算機として行動してください。
相手から入力された整数に1を足して返してください。
`;

const promptB = `
あなたには計算機として行動してください。
相手から入力された整数に1を足して返してください。
`;

const history: Array<{ body: string, player: 'a' | 'b' }> = [];
let player: 'a' | 'b' = 'a';

(async () => {
  let count = 1;
  while (true) {
    console.log(`---------------${player}さんのターン${count}↓----------------`);
    const url = 'http://localhost:3000/api/chat-stream/';
    const params: RequestProps = {
      systemMessage: '',
      message: '',
      history: [],
      modelParams: {
        temperature: 1,
        max_tokens: 256
      }
    };
    params.systemMessage = player === 'a' ? promptA : promptB;
    if (history.length === 0) {
      params.message = '1';
    } else {
      params.message = history[history.length - 1].body;
      history.slice(0, history.length - 1).forEach((h) => {
        if (player === 'a') {
          if (h.player === 'a') {
            params.history.push({ body: h.body, role: 'ai' });
          } else {
            params.history.push({ body: h.body, role: 'human' });
          }
        } else {
          if (h.player === 'a') {
            params.history.push({ body: h.body, role: 'human' });
          } else {
            params.history.push({ body: h.body, role: 'ai' });
          }
        }
      });
    }
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
    let resultMessage = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const decodedValue = decoder.decode(value, { stream: true });
      process.stdout.write(decodedValue);
      resultMessage += decodedValue;
    }
    reader.releaseLock();
    // const resultMessage = 'aa' + count;
    history.push({ body: resultMessage, player });
    if (player === 'a') {
      player = 'b';
    } else {
      player = 'a';
    }
    console.log('');
    count++;
    if (count > 10) break;
  }
})().catch(() => {});

export {};
