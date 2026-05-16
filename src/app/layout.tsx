import { ClerkProvider } from '@clerk/nextjs';
import { cookies } from 'next/headers';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import '@/app/globals.css';
import { RegisterServiceWorker } from '@/components/pwa/register-service-worker';
import { ThemeColorMeta } from '@/components/pwa/theme-color-meta';

export const metadata: Metadata = {
  title: 'Fit Track',
  description: 'Mobile-first workout tracking PWA.',
  applicationName: 'Fit Track',
  appleWebApp: {
    capable: true,
    title: 'Fit Track',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b1020',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

type RootLayoutProps = {
  children: ReactNode;
};

/** Renders the root document with Clerk and PWA registration. */
export default async function RootLayout({ children }: RootLayoutProps): Promise<ReactNode> {
  const cookieStore = await cookies();
  const theme = cookieStore.get('fit_theme')?.value ?? 'dark';

  return (
    <ClerkProvider>
      <html data-theme={theme} lang="en">
        <head>
          <meta content="#0b1020" id="theme-color-meta" name="theme-color" />
        </head>
        <body>
          {children}
          <RegisterServiceWorker />
          <ThemeColorMeta />
        </body>
      </html>
    </ClerkProvider>
  );
}
