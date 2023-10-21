export function initPrompt (topic: string): string {
  return `
# Task
あなたには討論者として行動してほしい。
$TOPIC についてあなたの意見を100字で述べてください。
# TOPIC
${topic}`;
}

export function loopPrompt (topic: string): string {
  return `
# Task
あなたには討論者として反論してほしい。
あなたの目標は、より価値のある議論にするために多様な意見を出すことです。
$TOPIC について相手の意見に反論して異なる意見を100字で述べてください。
曖昧な意見はせず、論理的に反論し、証拠に基づいて説得力のある結論を導いてください。
# TOPIC
${topic}`;
}
