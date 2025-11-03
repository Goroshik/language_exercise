'use client';

import { ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { usePathname } from 'next/navigation';

import theme from 'src/theme';
import { AlertProvider } from 'src/components/AlertProvider';
import ChatWidget from 'src/components/ChatWidget';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  // Hide chat widget on auth pages
  const isAuthPage = pathname?.startsWith('/auth/');

  return (
    <html lang="en">
      <body>
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
