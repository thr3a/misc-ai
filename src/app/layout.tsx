import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider, ColorSchemeScript, Container } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import type { Metadata } from 'next';
import { theme } from '@/theme';
import { Providers } from '@/providers';
import { headers } from 'next/headers';

export async function generateMetadata (): Promise<Metadata> {
  const csrfToken = headers().get('X-CSRF-Token') ?? 'missing';
  return {
    title: 'ChatGPTのごった煮',
    description: 'ChatGPTのごった煮',
    other: {
      'x-csrf-token': csrfToken
    }
  };
}

export default function RootLayout ({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no" />
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Notifications position={'top-right'} />
          <Providers>
            <Container id='container'>
              {children}
            </Container>
          </Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
