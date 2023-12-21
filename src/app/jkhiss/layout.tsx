import { Title, Anchor, Text } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JKヒス構文メーカー',
  description: 'ヒス構文もAIで生成なんだ じゃあ私は◯ねってこと？',
  viewport: {
    width: '375'
  }
};

export default function PageLayout ({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <Anchor href="/jkhiss">
        <Title mt={'sm'} order={2}>{metadata.title as string}</Title>
      </Anchor>
      <Text mb={'sm'} fz={'12px'} c={'dimmed'} fw={'bold'}>{metadata.description as string}</Text>
      {children}
    </>
  );
}
