"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, LogIn, LayoutDashboard, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useUser } from "@/firebase";
import TempleIcon from "@/components/icons/TempleIcon";

export function Header() {
  const { t, language } = useLanguage();
  const { user, isUserLoading } = useUser();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("home");

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

      const sections = navItems.map((item) =>
        document.querySelector(item.href)
      );
      let currentSection = "home";

      sections.forEach((section) => {
        if (section) {
          const sectionTop = (section as HTMLElement).offsetTop;
          if (window.scrollY >= sectionTop - 120) {
            currentSection = section.id;
          }
        }
      });
      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navItems]);

  const AuthButton = ({ className }: { className?: string }) => {
    if (isUserLoading) {
      return <div className={cn("h-9 w-24 animate-pulse rounded-md bg-muted", className)} />;
    }
    if (user) {
      return (
        <Link href="/dashboard" className={className}>
          <Button variant="ghost" size="sm" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className={cn(language === "hi" ? "font-hindi" : "")}>
              {language === "hi" ? "डैशबोर्ड" : "Dashboard"}
            </span>
          </Button>
        </Link>
      );
    }
    return (
      <Link href="/login" className={className}>
        <Button variant="ghost" size="sm" className="gap-2">
          <LogIn className="h-4 w-4" />
          <span className={cn(language === "hi" ? "font-hindi" : "")}>
            {language === "hi" ? "लॉग इन" : "Login"}
          </span>
        </Button>
      </Link>
    );
  };

  const NavLinks = ({
    className,
    itemClassName,
    isMobile = false,
  }: {
    className?: string;
    itemClassName?: string;
    isMobile?: boolean;
  }) => (
    <nav className={cn("flex items-center gap-1", className)}>
      {navItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          onClick={() => setIsMobileMenuOpen(false)}
          data-active={activeSection === item.href.substring(1)}
          className={cn(
            "relative px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
            activeSection === item.href.substring(1)
              ? "text-primary"
              : "text-muted-foreground",
            isMobile && "w-full py-4 text-lg border-b border-border/50",
            itemClassName,
            language === "hi" ? "font-hindi" : ""
          )}
        >
          {item.label}
          {!isMobile && activeSection === item.href.substring(1) && (
            <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary animate-in fade-in slide-in-from-bottom-1" />
          )}
        </a>
      ))}
    </nav>
  );

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-500",
        isScrolled
          ? "border-b border-border/40 bg-background/80 shadow-sm backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 group">
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 shadow-sm ring-1 ring-primary/20 backdrop-blur-sm transition-colors group-hover:bg-amber-100">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-primary/20 bg-white flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                fill 
                className="object-contain p-0.5 z-10"
                onError={(e) => {
                  (e.target as any).style.opacity = '0';
                }}
              />
              <TempleIcon className="h-6 w-6 text-primary absolute" />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span
                className={cn(
                  "text-lg font-bold text-foreground",
                  language === "hi" ? "font-hindi" : "font-headline"
                )}
              >
                {language === "hi" ? "मंदिर समिति" : "Mandir Samiti"}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {language === "hi" ? "बहपुरा" : "Bahpura"}
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 lg:flex">
          <NavLinks />
          <div className="h-6 w-px bg-border/60" />
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <AuthButton />
            <Link href="#donate">
              <Button size="sm" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <Heart className="h-4 w-4 fill-current" />
                <span className={cn(language === "hi" ? "font-hindi" : "")}>
                  {t.navDonate}
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <AuthButton className="mr-1" />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-xs">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>Main navigation menu for the temple website.</SheetDescription>
              </SheetHeader>
              
              <div className="flex h-20 items-center border-b px-6 bg-amber-50">
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-primary/20 bg-white flex items-center justify-center">
                    <Image 
                      src="/logo.png" 
                      alt="Logo" 
                      fill 
                      className="object-contain p-0.5 z-10"
                      onError={(e) => {
                        (e.target as any).style.opacity = '0';
                      }}
                    />
                    <TempleIcon className="h-5 w-5 text-primary absolute" />
                  </div>
                  <span className={cn("text-lg font-bold", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                    {language === 'hi' ? 'मंदिर समिति' : 'Mandir Samiti'}
                  </span>
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-8">
                <NavLinks
                  className="flex-col items-start gap-0"
                  isMobile
                />
              </div>

              <div className="border-t bg-secondary/30 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {language === 'hi' ? 'भाषा' : 'Language'}
                  </span>
                  <LanguageSwitcher />
                </div>
                <Link href="#donate" onClick={() => setIsMobileMenuOpen(false)} className="block">
                  <Button className="w-full gap-2 bg-accent text-accent-foreground">
                    <Heart className="h-4 w-4 fill-current" />
                    {t.navDonate}
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
