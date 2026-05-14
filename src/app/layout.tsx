
import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Poppins, Mukta } from 'next/font/google';
import { FirebaseClientProvider } from '@/firebase';
import * as React from 'react';
import { BackToTop } from '@/components/layout/BackToTop';
import Script from 'next/script';

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
  title: 'Surya Mandir Bahpura | सूर्य मंदिर बहपुरा',
  description: 'Welcome to Mandir Samiti Bahpura. Preserve Faith, Serve Community.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            <Script 
              src="https://sdk.cashfree.com/js/v3/cashfree.js" 
              strategy="afterInteractive" 
            />
            
            <a href="#main-content" className="skip-link">Skip to main content</a>
            {children}
            <BackToTop />
            <Toaster />
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
