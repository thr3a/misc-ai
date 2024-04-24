const common = `
# Encouraged rules
- Affirmation
- Logical and convincing ideas
- Innovative and creative ideas
# Prohibited rules
- Ideas with ambiguous conclusions
- The idea of concluding on each individual's preferences
- An ethical mindset
`;

export function initPrompt(topic: string): string {
  return `
# Task
Act as a brainstorming participant.
Output your ideas about $TOPIC in 100 characters of Japanese, starting with the conclusion.
${common}
# TOPIC
${topic}
`;
}

export function loopPrompt(topic: string): string {
  return `
# Task
Discussing $TOPIC with me.
Your goal is to make the discussion more meaningful by finding flaws in my ideas and suggesting new ideas that are different from mine.
Please find flaws in my idea and suggest new idea in 100 characters in Japanese.
${common}
# Topic
${topic}
`;
}
