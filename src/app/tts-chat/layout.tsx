import type { Metadata } from 'next';
import 'mantine-ai-elements/styles.css';

export const metadata: Metadata = {
  title: 'tobariボイスチャット',
  description: 'クールビューティーな tobari が文章と音声で返事をしてくれます。画像も最大4枚まで添付できます。'
};

// 関数名は変えないこと
export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
