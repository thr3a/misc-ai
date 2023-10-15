import { Title } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '英語でググり隊',
  description: '英語のGoogle検索キーワードに翻訳します'
};

export default function PageLayout ({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <Title mt={'md'} order={2}>{metadata.title as string}</Title>
      <Title order={6} mb={'md'} c={'dimmed'}>{metadata.description as string}</Title>
      {children}
    </>
  );
}
