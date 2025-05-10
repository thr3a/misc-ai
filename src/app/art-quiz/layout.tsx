import { Box, Title } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '神話4択クイズ',
  description: '４択クイズで絵画知識を学ぼう'
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
      <Box maw={500} mx='auto'>
        {children}
      </Box>
    </>
  );
}
