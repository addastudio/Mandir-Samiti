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
import { getLocalCmsContent } from '@/lib/cms';

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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getLocalCmsContent('settings.json');
  
  const siteTitle = settings?.site_title_en || 'Mandir Samiti Bahpura';
  const hindiTitle = settings?.site_title_hi || 'मंदिर समिति बहपुरा';
  const faviconPath = settings?.favicon || '/favicon.ico';

  return {
    title: {
      default: `${siteTitle} | ${hindiTitle}`,
      template: `%s | ${siteTitle}`
    },
    description: 'Welcome to Mandir Samiti Bahpura. Preserve Faith, Serve Community.',
    icons: {
      icon: [{ url: faviconPath }],
      shortcut: faviconPath,
      apple: faviconPath,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            <Script 
              src="https://sdk.cashfree.com/js/v3/cashfree.js" 
              strategy="afterInteractive" 
            />
            
            <a href="#main-content" className="skip-link">Skip to main content</a>
            {children}
            <BackToTop />
            <Toaster />

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
                  // Cross-domain fix for Vercel/Netlify CMS authentication
                  // Force the identity instance to point to the primary Netlify domain
                  const netlifyUrl = "https://mandirsamiti.netlify.app";
                  if (window.location.hostname !== new URL(netlifyUrl).hostname) {
                    console.log("Setting Netlify Identity URL for cross-domain auth:", netlifyUrl);
                    localStorage.setItem("netlifySiteURL", netlifyUrl);
                  }
                }
              `}
            </Script>
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
