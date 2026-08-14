'use client';

import { ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { usePathname } from 'next/navigation';

import { AlertProvider } from 'src/components/AlertProvider';
import ChatWidget from 'src/components/ChatWidget';
import theme from 'src/theme';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  // Hide chat widget on auth pages
  const isAuthPage = pathname?.startsWith('/auth/');

  return (
    <html
      lang="en"
      style={{
        overflowX: 'hidden',
        width: '100vw',
        maxWidth: '100vw',
        margin: 0,
        padding: 0
      }}
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          overflowX: 'hidden',
          width: '100vw',
          maxWidth: '100vw',
          position: 'relative'
        }}
      >
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <AlertProvider>
              {children}
              {!isAuthPage && <ChatWidget />}
            </AlertProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
