import { Anchor, Title } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI討論コロシアム',
  description: 'テスト中'
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Anchor href='/arena'>
        <Title mt={'sm'} order={2}>
          {metadata.title as string}
        </Title>
      </Anchor>
      <Title order={6} mb={'md'} c={'dimmed'}>
        {metadata.description as string}
      </Title>
      {children}
    </>
  );
}
