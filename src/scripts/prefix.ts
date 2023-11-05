import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import { HumanMessage, AIMessage } from 'langchain/schema';

(async () => {
  const pastMessages = [
    new HumanMessage('My name\'s Jonas'),
    new AIMessage('Nice to meet you, Jonas!')
  ];

  const memory = new BufferMemory({
    chatHistory: new ChatMessageHistory(pastMessages),
    returnMessages: false, // .loadMemoryVariables({})の挙動が変わる
    aiPrefix: 'oppai',
    humanPrefix: 'taro'
  });

  const h = await memory.loadMemoryVariables({});
  console.log(h);
})();
