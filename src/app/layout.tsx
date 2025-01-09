import { theme } from '@/theme';
import { ColorSchemeScript, Container, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import type { Metadata } from 'next';
// import { headers } from 'next/headers';
import Script from 'next/script';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'みすくあい',
    description: 'みすくあい'
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang='ja'>
      <head>
        <ColorSchemeScript />
        <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no' />
        <Script id='google-tag-manager' strategy='afterInteractive'>
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
        <MantineProvider theme={theme} forceColorScheme='light'>
          <Container id='container'>{children}</Container>
        </MantineProvider>
      </body>
    </html>
  );
}
