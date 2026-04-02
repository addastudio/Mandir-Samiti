import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Poppins, Mukta } from 'next/font/google';
import { FirebaseClientProvider } from '@/firebase';
import * as React from 'react';
import { BackToTop } from '@/components/layout/BackToTop';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const mukta = Mukta({
  subsets: ['devanagari', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mukta',
});

export const metadata: Metadata = {
  title: 'Bahpura Mandir',
  description:
    'मंदिर समिति बहपुरा में आपका स्वागत है। Welcome to Mandir Samiti Bahpura.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
};

export default function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<any>;
}) {
  const children = props.children;
  const params = React.use(props.params);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'font-body antialiased',
          poppins.variable,
          mukta.variable
        )}
        suppressHydrationWarning={true}
      >
        <FirebaseClientProvider>
          <LanguageProvider>
            {/* Accessibility: Skip to Content link for keyboard users */}
            <a 
              href="#main-content" 
              className="skip-link"
            >
              Skip to main content
            </a>
            {children}
            <BackToTop />
            <Toaster />
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
