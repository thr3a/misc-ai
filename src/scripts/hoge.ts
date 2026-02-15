import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';
import { Output, generateText } from 'ai';
import { z } from 'zod';
const localOpenAI = createOpenAI({
  baseURL: 'http://192.168.16.21:8000/v1'
});

const run = async () => {
  const testSchema = z.object({
    secretCode: z.string().describe("必ず 'PINEAPPLE' という文字列を入れてください")
  });

  const { output } = await generateText({
    // model: localOpenAI.chat('main'),
    model: localOpenAI.chat('main'),
    output: Output.object({
      schema: testSchema
    }),
    prompt: 'こんにちは'
  });

  console.log(output);
};

run();
