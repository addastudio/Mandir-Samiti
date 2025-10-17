"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import TempleIcon from "@/components/icons/TempleIcon";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const { t, language } = useLanguage();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { href: "#home", label: t.navHome },
    { href: "#about", label: t.navAbout },
    { href: "#events", label: t.navEvents },
    { href: "#seva", label: t.navSeva },
    { href: "#gallery", label: t.navGallery },
    { href: "#contact", label: t.navContact },
  ];

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const NavLinks = ({
    className,
    itemClassName,
  }: {
    className?: string;
    itemClassName?: string;
  }) => (
    <nav className={cn("flex items-center gap-1", className)}>
      {navItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          onClick={() => setIsMobileMenuOpen(false)}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
            itemClassName,
            language === "hi" ? "font-hindi" : ""
          )}
        >
          {item.label}
        </a>
      ))}
      <a
        href="#donate"
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          "ml-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          itemClassName,
          language === "hi" ? "font-hindi" : ""
        )}
      >
        {t.navDonate}
      </a>
    </nav>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="#home" className="flex items-center gap-2">
          <TempleIcon className="h-8 w-8 text-primary" />
          <span
            className={cn(
              "text-xl font-bold text-foreground",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            {language === "hi" ? "बहपुरा मंदिर" : "Bahpura Mandir"}
          </span>
        </Link>

        <div className="hidden items-center gap-4 md:flex">
          <NavLinks />
          <LanguageSwitcher />
        </div>

        <div className="flex items-center md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full bg-background">
              <div className="flex h-full flex-col p-6">
                <div className="mb-8 flex items-center justify-between">
                   <Link href="#home" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                      <TempleIcon className="h-8 w-8 text-primary" />
                      <span className={cn("text-xl font-bold", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                        {language === 'hi' ? 'बहपुरा मंदिर' : 'Bahpura Mandir'}
                      </span>
                    </Link>
                  <SheetTrigger asChild>
                     <Button variant="ghost" size="icon">
                        <X className="h-6 w-6" />
                        <span className="sr-only">Close menu</span>
                      </Button>
                  </SheetTrigger>
                </div>
                <NavLinks
                  className="flex-col items-start space-y-2"
                  itemClassName="w-full text-left text-lg"
                />
                <div className="mt-auto pt-6">
                  <LanguageSwitcher />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
