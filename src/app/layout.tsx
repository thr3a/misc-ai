import Script from 'next/script';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider, Container, ColorSchemeScript } from '@mantine/core';
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
        <ColorSchemeScript />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no" />
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-5C9CZHR');
        `}
        </Script>
      </head>
      <body>
        <MantineProvider theme={theme} forceColorScheme="light">
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
