import { Title } from '@mantine/core';
import type { Metadata } from 'next';

const title = '絵画解説';
const description = '画像をアップロードするとAIが解説します。';

export const metadata: Metadata = {
  title,
  description
};

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Title mt='md' order={2}>
        {title}
      </Title>
      <Title order={6} mb='md' c='dimmed'>
        {description}
      </Title>
      {children}
    </>
  );
};

export default PageLayout;
