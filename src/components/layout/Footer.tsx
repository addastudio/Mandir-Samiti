"use client";

import * as React from "react";
import Image from "next/image";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import TempleIcon from "@/components/icons/TempleIcon";

export function Footer() {
  const { t, language } = useLanguage();
  const [settings, setSettings] = React.useState<any>(null);
  const [logoError, setLogoError] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => setSettings(null));
  }, []);

  const navItems = [
    { href: "/#home", label: t.navHome },
    { href: "/#notices", label: t.noticesTitle },
    { href: "/about", label: t.navAbout },
    { href: "/donate", label: t.navDonate },
    { href: "/#contact", label: t.navContact },
  ];

  const socialIcons = [
    { icon: Facebook, href: "#", name: "Facebook" },
    { icon: Instagram, href: "#", name: "Instagram" },
    { icon: Youtube, href: "#", name: "Youtube" },
  ];

  const siteName = language === 'hi' 
    ? (settings?.site_title_hi || "मंदिर समिति बहपुरा")
    : (settings?.site_title_en || "Mandir Samiti Bahpura");

  const siteSubtitle = language === 'hi' ? "श्रद्धा और सेवा" : "Faith and Service";

  return (
    <footer className="bg-secondary border-t border-border/50">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Branding Section - Spaced & Refined */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="relative h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full border-2 border-primary/10 bg-white flex flex-shrink-0 items-center justify-center shadow-sm">
                {settings?.favicon && !logoError ? (
                  <Image 
                    src={settings.favicon} 
                    alt="Logo" 
                    fill 
                    className="object-contain p-1.5 z-10"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <TempleIcon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  className={cn(
                    "text-lg sm:text-xl font-bold text-foreground leading-tight truncate block",
                    language === "hi" ? "font-hindi" : "font-headline"
                  )}
                >
                  {siteName}
                </span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black opacity-70 whitespace-nowrap">
                  {siteSubtitle}
                </span>
              </div>
            </div>
            <p className={cn(
              "text-sm text-muted-foreground leading-relaxed max-w-xs",
              language === 'hi' ? 'font-hindi' : ''
            )}>
              {t.heroSubtitle}
            </p>
          </div>

          <div className="md:pl-10 grid grid-cols-2 gap-8 md:block md:space-y-12">
            <div>
              <h3
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest text-foreground opacity-60",
                  language === "hi" ? "font-hindi" : ""
                )}
              >
                {t.footerQuickLinks}
              </h3>
              <ul className="mt-6 space-y-4">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className={cn(
                        "text-sm text-muted-foreground transition-all hover:text-primary hover:translate-x-1 inline-block",
                        language === "hi" ? "font-hindi" : ""
                      )}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="md:hidden">
               <h3
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest text-foreground opacity-60",
                  language === "hi" ? "font-hindi" : ""
                )}
              >
                {t.contactFollow}
              </h3>
              <div className="mt-6 flex items-center gap-3">
                {socialIcons.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="h-9 w-9 flex items-center justify-center rounded-full bg-white border border-border/50 text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground shadow-sm"
                    aria-label={`Follow us on ${social.name}`}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <h3
              className={cn(
                "text-[10px] font-black uppercase tracking-widest text-foreground opacity-60",
                language === "hi" ? "font-hindi" : ""
              )}
            >
              {t.contactFollow}
            </h3>
            <div className="mt-6 flex items-center gap-3">
              {socialIcons.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-border/50 text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:scale-110 shadow-sm"
                  aria-label={`Follow us on ${social.name}`}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-border/40">
              <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                {language === 'hi' 
                  ? 'मंदिर के विकास में अपनी सहभागिता सुनिश्चित करें। आपका सहयोग हमारे समुदाय की नींव है।' 
                  : 'Ensure your participation in the temple\'s development. Your support is our community\'s foundation.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-border/40 pt-8 text-center">
          <p className={cn(
            "text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-medium opacity-60",
            language === "hi" ? "font-hindi" : ""
          )}>
            {t.footerCopyright}
          </p>
        </div>
      </div>
    </footer>
  );
}