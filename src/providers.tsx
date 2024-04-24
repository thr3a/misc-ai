'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

export function Providers({ children }: { children: ReactNode }): JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
            staleTime: 300000
          }
        }
      })
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
