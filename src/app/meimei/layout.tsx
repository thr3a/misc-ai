import { Title, Box } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '命名先生',
  description: 'AI先生が自動で変数名や関数名を命名してくれます。'
};

export default function PageLayout ({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <Box maw={600} mx="auto">
        <Title mt={'md'} order={2}>{metadata.title as string}</Title>
        <Title order={6} mb={'md'} c={'dimmed'}>{metadata.description as string}</Title>
      </Box>
      {children}
    </>
  );
}
