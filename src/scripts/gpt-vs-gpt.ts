import { type RequestProps } from '@/app/api/chat-stream/route';
const topic = 'vim vs emacs';

const promptA = `
あなたには計算機として行動してください。
入力された整数に1を足して出力してください。例えば500と入力されたら501を出力してください。
`;

const promptB = `
あなたには計算機として行動してください。
入力された整数に1を足して出力してください。例えば500と入力されたら501を出力してください。
`;

const history: Array<{ body: string, player: 'a' | 'b' }> = [];
let player: 'a' | 'b' = 'b';

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
        temperature: 0,
        max_tokens: 256,
        name: 'gpt-3.5-turbo'
      }
    };
    params.systemMessage = player === 'a' ? promptA : promptB;
    if (history.length === 0) {
      const initMessage = '1';
      params.message = initMessage;
      history.push({ body: initMessage, player: (player === 'a' ? 'b' : 'a') });
    } else {
      params.message = history[history.length - 1].body;
      history.slice(0, history.length - 1).forEach((h) => {
        // 1回目はplayer=a
        if (player === 'a') {
          if (h.player === 'a') {
            params.history.push({ body: h.body, role: 'human' });
          } else {
            params.history.push({ body: h.body, role: 'ai' });
          }
        } else {
          if (h.player === 'a') {
            params.history.push({ body: h.body, role: 'ai' });
          } else {
            params.history.push({ body: h.body, role: 'human' });
          }
        }
      });
    }
    console.log(params.history.map((h) => `${h.role}: ${h.body}`));
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
    if (count === 3) break;
    count++;
    console.log();
  }
})().catch(() => {});

export {};
