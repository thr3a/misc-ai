import { google } from '@ai-sdk/google';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

(async () => {
  const result = await streamText({
    model: google('models/gemini-1.5-flash-latest', {
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE'
        }
      ]
    }),
    maxTokens: 512,
    temperature: 0,
    prompt: '2024年3月20日の30日後は何日?'
  });

  for await (const textPart of result.textStream) {
    console.log(textPart);
  }
})();
