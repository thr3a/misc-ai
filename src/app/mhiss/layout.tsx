import { Title, Anchor } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'お母さんヒス構文メーカー',
  description: 'ヒス家庭を疑似体験'
};

export default function PageLayout ({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <Anchor href="/mhiss">
        <Title mt={'md'} order={2}>{metadata.title as string}</Title>
      </Anchor>
      <Title order={6} mb={'sm'} c={'dimmed'}>{metadata.description as string}</Title>
      {children}
    </>
  );
}
