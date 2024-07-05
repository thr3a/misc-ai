import { Anchor, Title } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'お母さんヒス構文メーカー改',
  description: 'ヒス構文もAIで生成なんだ じゃあお母さんはいらないってこと？',
  viewport: {
    width: '375'
  }
};

export default function PageLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <Anchor href='/mhiss'>
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
