import { type RequestProps } from '@/app/api/chat-stream/route';

const topic = '最強のアイスクリームの味';
const initPrompt = `
#TASK
あなたには討論者として意見してほしい。
指示された {TOPIC} についてあなたの明確な意見を簡潔に述べてください。
曖昧な意見はせず、簡潔に、論理的に反論し、証拠に基づいて説得力のある意見を導いてください。
`;

const prompt = `
# TASK
あなたには討論者として反論してほしい。
{TOPIC} について指示された意見に反論して異なる意見を述べてください。
曖昧な意見はせず、簡潔に、論理的に反論し、証拠に基づいて説得力のある結論を導いてください。
あなたの目標は議論に多様な意見を出すことです。
TOPIC: ${topic}
`;

async function getMessage (params: RequestProps): Promise<string> {
  let resultMessage = '';
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
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const decodedValue = decoder.decode(value, { stream: true });
    process.stdout.write(decodedValue);
    resultMessage += decodedValue;
  }
  console.log();
  reader.releaseLock();
  return resultMessage;
}

let latestMessage = '';
(async () => {
  const params: RequestProps = {
    systemMessage: initPrompt,
    message: topic,
    history: [],
    modelParams: {
      temperature: 0,
      name: 'gpt-3.5-turbo'
    }
  };
  latestMessage = await getMessage(params);
  let count = 1;
  while (true) {
    console.log(`---------------${count}↓----------------`);
    const params: RequestProps = {
      systemMessage: prompt,
      message: latestMessage,
      history: [],
      modelParams: {
        temperature: 1,
        // max_tokens: 1024,
        name: 'gpt-3.5-turbo'
        // name: 'gpt-4'
      }
    };
    latestMessage = await getMessage(params);
    if (count === 10) break;
    count++;
  }
})().catch(() => {});

export {};
