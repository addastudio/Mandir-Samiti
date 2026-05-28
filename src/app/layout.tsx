import type { Metadata, Viewport } from 'next';
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
  display: 'swap',
});

const mukta = Mukta({
  subsets: ['devanagari', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mukta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Surya Mandir Bahpura | सूर्य मंदिर बहपुरा',
  description: 'Official portal for Mandir Samiti Bahpura. Preserving faith and serving the community since decades. Join us for Darshan, Aarti, and Community Service.',
  keywords: 'Surya Mandir, Bahpura, Mandir Samiti, Bihta Temple, Patna Temples, Hindu Devotion, Temple Donations, Prayer Requests, Bihar Temples',
  metadataBase: new URL('https://www.suryamandir.online'),
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/uploads/suryamandir.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/uploads/suryamandir.svg' }
    ]
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/?lang=en',
      'hi-IN': '/?lang=hi',
    },
  },
  openGraph: {
    title: 'Surya Mandir Bahpura | सूर्य मंदिर बहपुरा',
    description: 'Preserve Faith, Serve Community. Join the Mandir Samiti Bahpura in devotion and service.',
    url: 'https://www.suryamandir.online',
    siteName: 'Mandir Samiti Bahpura',
    locale: 'hi_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Surya Mandir Bahpura',
    description: 'Preserve Faith, Serve Community.',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#d97706',
};

export default function RootLayout({
  children,
}: {
  children: React.Node;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(poppins.variable, mukta.variable)}>
      <body
        className="font-body antialiased bg-background text-foreground"
        suppressHydrationWarning
      >
        <FirebaseClientProvider>
          <LanguageProvider>
            <Script 
              src="https://sdk.cashfree.com/js/v3/cashfree.js" 
              strategy="afterInteractive" 
            />
            
            <a href="#main-content" className="skip-link" aria-label="Skip to main content">Skip to main content</a>
            {children}
            <BackToTop />
            <Toaster />
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
