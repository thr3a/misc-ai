import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Null cart - 架空のECサイト',
  description: '本物の通販での浪費を防ぐための架空ECサイト。安全に買い物の疑似体験ができます。'
};

export default function NullCartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
