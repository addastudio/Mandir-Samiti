"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, LogIn, Heart, User as UserIcon, ShieldCheck } from "lucide-react";
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
} from "@/components/ui/sheet";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import TempleIcon from "@/components/icons/TempleIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { doc } from "firebase/firestore";
import { usePathname } from "next/navigation";

export function Header() {
  const { t, language } = useLanguage();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("home");
  const [settings, setSettings] = React.useState<any>(null);
  const [logoError, setLogoError] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => setSettings(null));
  }, []);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);
  const { data: adminDoc } = useDoc(adminRoleRef);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc(userDocRef);

  const navItems = [
    { href: "/#home", label: t.navHome, isAnchor: true },
    { href: "/#notices", label: t.noticesTitle, isAnchor: true },
    { href: "/about", label: t.navAbout, isAnchor: false },
    { href: "/#events", label: t.navEvents, isAnchor: true },
    { href: "/gallery", label: t.navGallery, isAnchor: false },
    { href: "/#contact", label: t.navContact, isAnchor: true },
  ];

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      if (pathname === '/') {
        const sections = navItems
          .filter(item => item.isAnchor)
          .map((item) => document.querySelector(item.href.replace('/', '')));
        let current = "home";
        sections.forEach((section) => {
          if (section && window.scrollY >= (section as HTMLElement).offsetTop - 120) {
            current = section.id;
          }
        });
        setActiveSection(current);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, navItems]);

  const siteName = language === 'hi' 
    ? (settings?.site_title_hi || "मंदिर समिति बहपुरा")
    : (settings?.site_title_en || "Mandir Samiti Bahpura");

  const AuthButton = ({ isMobile = false }: { isMobile?: boolean }) => {
    if (isUserLoading) return <div className="h-9 w-9 animate-pulse rounded-full bg-muted shrink-0" />;
    if (user) {
      return (
        <Link href="/dashboard" onClick={() => isMobile && setIsMobileMenuOpen(false)} className="shrink-0">
          <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-primary shadow-sm hover:scale-105 transition-all">
            <AvatarImage src={user.photoURL || userProfile?.photoURL || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Link>
      );
    }
    return (
      <Link href="/login" onClick={() => isMobile && setIsMobileMenuOpen(false)} className="shrink-0">
        <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-4">
          <LogIn className="h-4 w-4 mr-2" />
          <span className={cn("text-xs sm:text-sm", language === "hi" && "font-hindi")}>Login</span>
        </Button>
      </Link>
    );
  };

  return (
    <header className={cn(
      "fixed top-0 z-50 w-full transition-all duration-300",
      isScrolled || pathname !== '/' ? "border-b bg-background/95 backdrop-blur-md shadow-sm" : "bg-transparent"
    )}>
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Branding - Fixed Overlap Logic */}
        <Link href="/" className="flex items-center gap-3 min-w-0 flex-shrink mr-2 sm:mr-4 group">
          <div className="flex items-center gap-2 lg:gap-3 rounded-xl bg-amber-50/80 px-2 py-1.5 shadow-sm border border-primary/10">
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-full bg-white shrink-0 flex items-center justify-center border border-primary/5">
              {settings?.favicon && !logoError ? (
                <Image src={settings.favicon} alt="Logo" fill className="object-contain p-1" onError={() => setLogoError(true)} />
              ) : (
                <TempleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              )}
            </div>
            <div className="flex flex-col min-w-0 max-w-[120px] xs:max-w-[180px] sm:max-w-[240px] lg:max-w-none">
              <span className={cn("text-xs sm:text-base lg:text-lg font-bold truncate block leading-tight", language === "hi" ? "font-hindi" : "font-headline")}>
                {siteName}
              </span>
              <span className="text-[7px] sm:text-[9px] uppercase tracking-widest text-muted-foreground font-black opacity-70 hidden xs:block">
                {language === 'hi' ? 'श्रद्धा और सेवा' : 'Faith and Service'}
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className={cn(
                "px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                pathname === '/' ? (activeSection === item.href.replace('/#', '') ? "text-primary" : "text-muted-foreground") : (pathname === item.href ? "text-primary" : "text-muted-foreground")
              )}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4 border-l pl-6">
            <LanguageSwitcher />
            {adminDoc && (
              <Link href="/management">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-primary/20 text-primary hover:bg-primary/5 shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <AuthButton />
            <Link href="/donate">
              <Button size="sm" className="bg-accent text-accent-foreground font-bold h-9 px-4 shadow-sm hover:scale-105 transition-transform">
                <Heart className="h-4 w-4 mr-2 fill-current" />
                {t.navDonate}
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Nav Toggle */}
        <div className="flex lg:hidden items-center gap-1.5 sm:gap-3">
          <LanguageSwitcher />
          <AuthButton isMobile />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col p-0">
              <div className="h-20 flex items-center px-6 border-b bg-amber-50">
                <span className="font-bold text-lg truncate">{siteName}</span>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-6">
                {navItems.map((item) => (
                  <Link key={item.label} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="block py-4 text-lg font-medium border-b border-border/50">
                    {item.label}
                  </Link>
                ))}
                {adminDoc && (
                  <Link href="/management" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 py-4 text-lg font-bold text-primary border-b border-border/50">
                    <ShieldCheck className="h-5 w-5" /> Management
                  </Link>
                )}
              </div>
              <div className="p-6 border-t bg-secondary/30">
                <Link href="/donate" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full h-12 bg-accent text-accent-foreground font-bold shadow-lg">
                    <Heart className="h-5 w-5 mr-2 fill-current" /> {t.navDonate}
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
