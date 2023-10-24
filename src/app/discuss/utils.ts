const common = `
# Encouraged Contributions
- Ideas that are logically compelling
- Solutions that are innovative and creative
# Discouraged Contributions
- Opinions with ambiguous conclusions
- Opinions that boil down to matters of personal preference
- Opinion that respects ethics
`;

export function initPrompt (topic: string): string {
  return `
# Task
あなたはブレインストーミングの参加者です。
$TOPIC についてあなたの意見を結論から100字で述べてください。
${common}
# TOPIC
${topic}
#
`;
}

export function loopPrompt (topic: string): string {
  return `
# Task
You are discussing $TOPIC with me. You are in opposition.
Please be sure to refute my opinion in 100 characters in Japanese.
${common}
# TOPIC
${topic}
`;
}
