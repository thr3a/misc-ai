import { Anchor, Title } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '具体抽象抽象具体',
  description: '具体⇔抽象 相互変換'
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Anchor href='/abstract'>
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
