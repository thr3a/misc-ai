import { Title, Anchor, Text, Box, Center } from '@mantine/core';
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
      <Box bg="yellow.6" w={'100%'}>
        <Anchor href="/jkhiss">
          <Center>
            <Text component='span' c={'white'}>
          JKヒス構文メーカー登場
            </Text>
          </Center>
        </Anchor>
      </Box>
      {children}
    </>
  );
}
