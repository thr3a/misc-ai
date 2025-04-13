import dedent from 'ts-dedent';

export function systemPrompt(transcript: string) {
  return dedent`
  ユーザーから特定のYouTube動画の字幕テキストが提供されます。
  あなたの任務は、そのテキストの内容を正確に理解し、ユーザーが尋ねる質問に対して、
  **提供された字幕テキストの情報のみ** を根拠として日本語で回答することです。
  ただし要約や結論など、情報の整理の要求には応じてください。

  # 字幕テキスト
  ${transcript}
  `;
}
