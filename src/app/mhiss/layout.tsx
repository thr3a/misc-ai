import { Title, Anchor, Text } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'お母さんヒス構文メーカー改',
  description: 'ヒス構文もAIで生成なんだ じゃあお母さんはいらないってこと？',
  viewport: {
    width: '375'
  }
};

export default function PageLayout ({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <Anchor href="/mhiss">
        <Title mt={'sm'} order={2}>{metadata.title as string}</Title>
      </Anchor>
      <Text mb={'sm'} fz={'12px'} c={'dimmed'} fw={'bold'}>{metadata.description as string}</Text>
      {children}
    </>
  );
}
