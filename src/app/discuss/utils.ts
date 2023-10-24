const common = `
# Encouraged Ideas
- Logical and convincing ideas
- Innovative and creative ideas
# Prohibited Ideas
- Ideas with ambiguous conclusions
- The idea of concluding on each individual's preferences
- An ethical mindset
`;

export function initPrompt (topic: string): string {
  return `
# Task
Act as a brainstorming participant.
Output your ideas about $TOPIC in 100 characters of Japanese, starting with the conclusion.
${common}
# TOPIC
${topic}
`;
}

export function loopPrompt (topic: string): string {
  return `
# Task
Discussing $TOPIC with me. Act like you are a perverse person.
Please be sure to refute my idea in 100 characters in Japanese.
${common}
# TOPIC
${topic}
# Your opposing views
`;
}
