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

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script 
          src="https://identity.netlify.com/v1/netlify-identity-widget.js" 
          strategy="beforeInteractive" 
        />
      </head>
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
            {/* Cashfree SDK */}
            <Script 
              src="https://sdk.cashfree.com/js/v3/cashfree.js" 
              strategy="afterInteractive" 
            />
            
            <a 
              href="#main-content" 
              className="skip-link"
            >
              Skip to main content
            </a>
            {children}
            <BackToTop />
            <Toaster />

            {/* Script to handle Netlify Identity redirect after login */}
            <Script id="netlify-identity-redirect" strategy="afterInteractive">
              {`
                if (window.netlifyIdentity) {
                  window.netlifyIdentity.on("init", user => {
                    if (!user) {
                      window.netlifyIdentity.on("login", () => {
                        document.location.href = "/admin/";
                      });
                    }
                  });
                }
              `}
            </Script>
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}