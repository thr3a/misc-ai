import { type RequestProps } from '@/app/api/chat-stream/route';

// const prompt = `
// #TASK
// You act as a calculator.
// 指示された数値に1を加えた数値を出力してください。
// # Example
// 500 + 1 = 501
// `;
const topic = '唐揚げにレモンをかけるべきか否か';
const initPrompt = `
# TASK
指示された {TOPIC} についてあなたの意見を簡潔に述べてください。明確な考え曖昧な意見はNGです。
`;

(async () => {
  const params: RequestProps = {
    systemMessage: initPrompt,
    message: topic,
    history: [],
    modelParams: {
      temperature: 0,
      // max_tokens: 1024,
      name: 'gpt-3.5-turbo'
    }
  };
  const res = await fetch('http://localhost:3000/api/chat-stream/', {
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
  console.log();
  reader.releaseLock();
})().catch(() => {});

// const promptHuman = `
// #TASK
// $TOPIC についてあなたは「賛成」の確固たる強い意志を持って相手の意見に反論して自分の意見を簡潔に述べてください。建設的な議論をしてください
// TOPIC: ${topic}
// `;

// const promptAi = `
// #TASK
// $TOPIC についてあなたは「反対」の確固たる強い意志を持って相手の意見に反論して自分の意見を簡潔に述べてください。建設的な議論をしてください
// TOPIC: ${topic}
// `;

// (async () => {
//   let count = 1;
//   while (true) {
//     const role = count % 2 === 0 ? 'human(賛成)' : 'ai(反対)';
//     console.log(`---------------${role} ${count}↓----------------`);
//     const params: RequestProps = {
//       systemMessage: role === 'human(賛成)' ? promptHuman : promptAi,
//       message: '',
//       history: [],
//       modelParams: {
//         temperature: 1,
//         // max_tokens: 1024,
//         name: 'gpt-3.5-turbo'
//       }
//     };
//     if (history.length === 0) {
//       const initMessage = 'ではあなたから意見を簡潔に述べてください。それに対して私は反論します。';
//       params.message = initMessage;
//       history.push(initMessage);
//     } else {
//       params.message = history[history.length - 1];
//       history.slice(0, history.length - 1).forEach((h, index) => {
//         const role = index % 2 === 0 ? 'human' : 'ai';
//         params.history.push({ body: h, role });
//       });
//     }
//     const res = await fetch('http://localhost:3000/api/chat-stream/', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(params)
//     });
//     if (res.body === null) throw new Error('res.body is null');
//     const reader = res.body.getReader();
//     const decoder = new TextDecoder();
//     let resultMessage = '';
//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) break;
//       const decodedValue = decoder.decode(value, { stream: true });
//       process.stdout.write(decodedValue);
//       resultMessage += decodedValue;
//     }
//     console.log();
//     reader.releaseLock();
//     history.push(resultMessage);
//     if (count === 10) break;
//     count++;
//   }
// })().catch(() => {});

export {};
