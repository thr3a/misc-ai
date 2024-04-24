import { Box, Title } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'test',
  description: 'test'
};

export default function PageLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <Box maw={400} mx='auto'>
        <Title mt={'md'} order={2}>
          {metadata.title as string}
        </Title>
        <Title order={6} mb={'md'} c={'dimmed'}>
          {metadata.description as string}
        </Title>
      </Box>
      {children}
    </>
  );
}
