import { Title } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '言い換えAI',
  description: '単語/文章をシチュエーションに合わせてAIが変換!'
};

export default function PageLayout ({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <Title mt={'md'}>{metadata.title as string}</Title>
      <Title order={6} mb={'md'} c={'dimmed'}>{metadata.description as string}</Title>
      {children}
    </>
  );
}
