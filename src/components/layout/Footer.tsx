"use client";

import * as React from "react";
import Image from "next/image";
import { Facebook, Instagram, Youtube, MapPin } from "lucide-react";
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

  const siteName = language === 'hi' 
    ? (settings?.site_title_hi || "मंदिर समिति बहपुरा")
    : (settings?.site_title_en || "Mandir Samiti Bahpura");

  return (
    <footer className="bg-secondary border-t border-border/40">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          
          {/* BRANDING: Strict alignment to prevent overlap with Nav */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full border-2 border-primary/10 bg-white flex shrink-0 items-center justify-center shadow-sm">
                {settings?.favicon && !logoError ? (
                  <Image src={settings.favicon} alt="Logo" fill className="object-contain p-1.5" onError={() => setLogoError(true)} />
                ) : (
                  <TempleIcon className="h-7 w-7 text-primary" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={cn(
                  "text-lg sm:text-xl font-bold truncate block leading-tight", 
                  language === "hi" ? "font-hindi" : "font-headline"
                )}>
                  {siteName}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-70 truncate">
                  {language === 'hi' ? 'श्रद्धा और सेवा' : 'Faith and Service'}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {t.heroSubtitle}
            </p>
          </div>

          {/* QUICK LINKS */}
          <div className="md:col-span-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/60 mb-6">
              {t.footerQuickLinks}
            </h3>
            <ul className="space-y-4">
              <li><a href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t.navAbout}</a></li>
              <li><a href="/gallery" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t.navGallery}</a></li>
              <li><a href="/donate" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t.navDonate}</a></li>
              <li><a href="/#contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t.navContact}</a></li>
            </ul>
          </div>

          {/* SOCIAL & LEGAL */}
          <div className="md:col-span-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/60 mb-6">
              {t.contactFollow}
            </h3>
            <div className="flex items-center gap-3 mb-8">
              {[Facebook, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-white border shadow-sm text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <div className="pt-6 border-t border-border/40">
              <p className="text-[10px] text-muted-foreground italic flex items-center gap-2">
                <MapPin className="h-3 w-3 shrink-0" /> {t.contactAddress.replace('पता: ', '')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-border/40 pt-8 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-medium opacity-60">
            {t.footerCopyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
