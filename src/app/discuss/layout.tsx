import { Title, Box } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI言論コロシアム',
  description: 'ChatGPT vs ChatGPT'
};

export default function PageLayout ({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <Box maw={800} mx="auto">
        <Title mt={'md'} order={1}>{metadata.title as string}</Title>
        <Title order={6} mb={'md'} c={'dimmed'}>{metadata.description as string}</Title>
      </Box>
      {children}
    </>
  );
}
