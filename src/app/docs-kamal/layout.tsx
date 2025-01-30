import { Anchor, Title } from '@mantine/core';
import type { Metadata } from 'next';
import { appName } from './util';

export const metadata: Metadata = {
  title: `${appName}質問部屋`,
  description: `${appName}について回答します。`
};

export default function PageLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <Title mt={'md'} order={2}>
        {metadata.title as string}
      </Title>
      <Title order={6} mb={'md'} c={'dimmed'}>
        <Anchor href='https://kamal-deploy.org/' target='_blank'>
          Kamal
        </Anchor>
        とはDockerを利用したWebアプリケーションのデプロイメントツールです。公式ドキュメントに基づいて正確にチャットできます。
      </Title>
      {children}
    </>
  );
}
