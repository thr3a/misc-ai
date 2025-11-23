import { Title } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI MAGIシステム',
  description: '1つの疑問をGemini・GPT・Claudeに一括投げ込み'
};

// 関数名は変えないこと
export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Title mt={'md'} order={2}>
        {metadata.title as string}
      </Title>
      <Title order={6} mb={'md'} c={'dimmed'}>
        {metadata.description as string}
      </Title>
      {children}
    </>
  );
}
