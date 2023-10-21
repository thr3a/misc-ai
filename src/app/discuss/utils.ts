export function initPrompt (topic: string): string {
  return `
# Task
あなたには討論者として行動してほしい。
$TOPIC についてあなたの意見を100字で三段論法で述べてください。
一般論や曖昧な意見はNGです。証拠に基づいて論理的に説得力のある結論を先に述べてください。
# TOPIC
${topic}
`;
}

export function loopPrompt (topic: string): string {
  return `
# Task
あなたには討論者として反論してほしい。
あなたの目標は、より価値のある議論にするために他の人とは異なる視点を持つことです。
$TOPIC について相手の意見に反論して異なる意見を100字で三段論法で述べてください。
一般論や曖昧な意見はNGです。証拠に基づいて論理的に説得力のある結論を先に述べてください。
# TOPIC
${topic}
`;
}
