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

// Force revalidation to ensure CMS changes like title/favicon are updated in real-time on build
export const revalidate = 0;

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

/**
 * Dynamically generates metadata for the website.
 * Reads from content/settings.json which is managed by Decap CMS.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getLocalCmsContent('settings.json');
  
  const siteTitle = settings?.site_title_en || 'Mandir Samiti Bahpura';
  const hindiTitle = settings?.site_title_hi || 'मंदिर समिति बहपुरा';
  
  // The CMS saves paths as /uploads/filename.png. 
  // Next.js metadata will resolve this correctly from the public directory.
  const faviconPath = settings?.favicon || '/favicon.ico';

  return {
    title: {
      default: `${siteTitle} | ${hindiTitle}`,
      template: `%s | ${siteTitle}`
    },
    description:
      'मंदिर समिति बहपुरा में आपका स्वागत है। Welcome to Mandir Samiti Bahpura.',
    icons: {
      icon: [
        { url: faviconPath },
        { url: faviconPath, sizes: '32x32', type: 'image/png' },
      ],
      shortcut: faviconPath,
      apple: faviconPath,
    },
  };
}

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
                  // For Vercel deployments using Netlify Identity for CMS
                  const netlifySiteUrl = process.env.NEXT_PUBLIC_NETLIFY_SITE_URL;
                  if (netlifySiteUrl && window.location.hostname !== new URL(netlifySiteUrl).hostname) {
                    console.log("Setting Netlify Identity site URL for cross-domain auth");
                    localStorage.setItem("netlifySiteURL", netlifySiteUrl);
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