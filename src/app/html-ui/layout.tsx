import { Title } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TailwindCSS UI生成ツール',
  description: 'UI入力するとTailwindCSS対応のHTML生成できます。'
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Title mt={'md'} order={2}>
        {metadata.title as string}
      </Title>
      <Title order={6} mb={'md'} c={'dimmed'}>
        {metadata.description as string}
      </Title>
      {children}
    </>
  );
}
