import dedent from 'ts-dedent';

const markdownUrl =
  'https://raw.githubusercontent.com/thr3a/docs-generator-for-chatgpt/refs/heads/master/librechat/index.md';
export const appName = 'librechat';

export const systemPrompt = async (): Promise<string> => {
  try {
    const response = await fetch(markdownUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch markdown: ${response.status} ${response.statusText}`);
    }
    const markdown = await response.text();

    return dedent`
      あなたは、与えられたドキュメントの内容に基づき、ユーザーからの質問に正確に答える専門家です。
      提供された${appName}のドキュメントを深く理解し、ユーザーからの${appName}に関する技術的な質問に対し、正確な回答をしてください。
      ハルシネーション（ドキュメント内の事実に基づかない情報の生成）を絶対に避け、ドキュメントの内容のみを参照して回答してください。

      # ${appName}のドキュメントここから
      ${markdown}
      `;
  } catch (error) {
    throw new Error('Error fetching or processing markdown:');
  }
};
