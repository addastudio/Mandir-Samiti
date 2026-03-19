"use client";

import Image from "next/image";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import TempleIcon from "@/components/icons/TempleIcon";

export function Footer() {
  const { t, language } = useLanguage();

  const navItems = [
    { href: "#home", label: t.navHome },
    { href: "#about", label: t.navAbout },
    { href: "#donate", label: t.navDonate },
    { href: "#contact", label: t.navContact },
  ];

  const socialIcons = [
    { icon: Facebook, href: "#", name: "Facebook" },
    { icon: Instagram, href: "#", name: "Instagram" },
    { icon: Youtube, href: "#", name: "Youtube" },
  ];

  return (
    <footer className="bg-secondary">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-primary/20 bg-white flex items-center justify-center">
                <Image 
                  src="/logo.png" 
                  alt="Temple Logo" 
                  fill 
                  className="object-contain p-1 z-10"
                  onError={(e) => {
                    (e.target as any).style.opacity = '0';
                  }}
                />
                <TempleIcon className="h-8 w-8 text-primary absolute" />
              </div>
              <span
                className={cn(
                  "text-xl font-bold",
                  language === "hi" ? "font-hindi" : "font-headline"
                )}
              >
                {language === "hi" ? "बहपुरा मंदिर" : "Bahpura Mandir"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.heroSubtitle}
            </p>
          </div>

          <div>
            <h3
              className={cn(
                "text-lg font-semibold",
                language === "hi" ? "font-hindi" : ""
              )}
            >
              {t.footerQuickLinks}
            </h3>
            <ul className="mt-4 space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={cn(
                      "text-sm text-muted-foreground transition-colors hover:text-primary",
                      language === "hi" ? "font-hindi" : ""
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              className={cn(
                "text-lg font-semibold",
                language === "hi" ? "font-hindi" : ""
              )}
            >
              {t.contactFollow}
            </h3>
            <div className="mt-4 flex space-x-4">
              {socialIcons.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="text-muted-foreground transition-colors hover:text-primary"
                  aria-label={`Follow us on ${social.name}`}
                >
                  <social.icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p className={cn(language === "hi" ? "font-hindi" : "")}>
            {t.footerCopyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
