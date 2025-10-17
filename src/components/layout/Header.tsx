
"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, LogIn, LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import TempleIcon from "@/components/icons/TempleIcon";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useUser } from "@/firebase";

export function Header() {
  const { t, language } = useLanguage();
  const { user, isUserLoading } = useUser();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState('home');

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
      
      const sections = navItems.map(item => document.querySelector(item.href));
      let currentSection = 'home';
      
      sections.forEach(section => {
        if (section) {
          const sectionTop = (section as HTMLElement).offsetTop;
          if (window.scrollY >= sectionTop - 100) {
            currentSection = section.id;
          }
        }
      });
      setActiveSection(currentSection);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navItems]);

  const AuthButton = () => {
    if (isUserLoading) {
      return null;
    }
    if (user) {
      return (
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
      );
    }
    return (
      <Link href="/login">
        <Button variant="outline" size="sm">
          <LogIn className="mr-2 h-4 w-4" />
          Login
        </Button>
      </Link>
    );
  };

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
          data-active={activeSection === item.href.substring(1)}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary data-[active=true]:text-primary data-[active=true]:font-semibold",
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
          "ml-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90",
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
        <Link href="/" className="flex items-center gap-2">
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
          <AuthButton />
        </div>

        <div className="flex items-center md:hidden">
           <AuthButton />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full bg-background">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>Main navigation menu for the website.</SheetDescription>
                </SheetHeader>
              <div className="flex h-full flex-col p-6">
                <div className="mb-8 flex items-center justify-between">
                   <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
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
    