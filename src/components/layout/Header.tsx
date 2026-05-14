
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, LogIn, Heart, User as UserIcon, ShieldCheck, LayoutDashboard, UserPlus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import TempleIcon from "@/components/icons/TempleIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { doc } from "firebase/firestore";
import { usePathname } from "next/navigation";

export function Header() {
  const { t, language, setLanguage } = useLanguage();
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

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc(userDocRef);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);
  const { data: adminDoc } = useDoc(adminRoleRef);

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

  const AuthButtons = ({ isMobile = false }: { isMobile?: boolean }) => {
    if (isUserLoading) return <div className="h-9 w-9 animate-pulse rounded-full bg-muted shrink-0" />;
    if (user) {
      return (
        <Link href="/dashboard" onClick={() => isMobile && setIsMobileMenuOpen(false)} className="shrink-0">
          <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-primary shadow-sm hover:scale-110 transition-all duration-300">
            <AvatarImage src={user.photoURL || userProfile?.photoURL || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Link>
      );
    }
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <Link href="/login" onClick={() => isMobile && setIsMobileMenuOpen(false)} className="shrink-0">
          <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-4">
            <LogIn className="h-4 w-4 sm:mr-2" />
            <span className={cn("hidden sm:inline text-xs sm:text-sm", language === "hi" && "font-hindi")}>{t.navLogin}</span>
          </Button>
        </Link>
        <Link href="/signup" onClick={() => isMobile && setIsMobileMenuOpen(false)} className="shrink-0">
          <Button variant="outline" size="sm" className="h-9 px-2 sm:px-4 border-primary/20 hover:bg-primary/5">
            <UserPlus className="h-4 w-4 sm:mr-2 text-primary" />
            <span className={cn("hidden sm:inline text-xs sm:text-sm", language === "hi" && "font-hindi")}>{t.navSignUp}</span>
          </Button>
        </Link>
      </div>
    );
  };

  const AdminButton = ({ isMobile = false }: { isMobile?: boolean }) => {
    if (!adminDoc) return null;
    return (
      <Link href="/management" onClick={() => isMobile && setIsMobileMenuOpen(false)} className="shrink-0">
        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-accent shadow-sm hover:scale-110 transition-all duration-300">
          <AvatarFallback className="bg-accent text-accent-foreground font-bold text-xs">
            <ShieldCheck className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </Link>
    );
  };

  return (
    <header className={cn(
      "fixed top-0 z-50 w-full transition-all duration-300",
      isScrolled || pathname !== '/' ? "border-b bg-background/95 backdrop-blur-md shadow-sm" : "bg-transparent"
    )}>
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <Link href="/" className="flex items-center min-w-0 group shrink-0">
          <div className="flex items-center gap-2 lg:gap-4 rounded-2xl bg-white/40 md:bg-amber-50/80 px-2.5 py-2 shadow-sm border border-primary/10 transition-all hover:bg-white/60">
            <div className="relative h-9 w-9 sm:h-11 sm:w-11 overflow-hidden rounded-full bg-white shrink-0 flex items-center justify-center border border-primary/10 shadow-inner">
              {settings?.favicon && !logoError ? (
                <Image src={settings.favicon} alt="Logo" fill className="object-contain p-1.5" onError={() => setLogoError(true)} />
              ) : (
                <TempleIcon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              )}
            </div>
            <div className="flex flex-col justify-center min-w-0 pt-0.5">
              <span className={cn(
                "text-sm sm:text-base lg:text-xl font-extrabold truncate tracking-tight", 
                language === "hi" ? "font-hindi leading-snug" : "font-headline leading-none"
              )}>
                {siteName}
              </span>
              <span className={cn(
                "text-[7px] sm:text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-black opacity-80 hidden xs:block truncate mt-0.5",
                language === 'hi' && "font-hindi text-[10px] tracking-normal leading-none opacity-60"
              )}>
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
                "px-3 py-2 text-sm font-bold transition-all hover:text-primary hover:scale-105",
                pathname === '/' ? (activeSection === item.href.replace('/#', '') ? "text-primary bg-primary/5 rounded-lg" : "text-muted-foreground") : (pathname === item.href ? "text-primary bg-primary/5 rounded-lg" : "text-muted-foreground"),
                language === 'hi' && "font-hindi text-base"
              )}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4 border-l border-primary/10 pl-6 ml-2">
            <LanguageSwitcher />
            <AdminButton />
            <AuthButtons />
            <Link href="/donate">
              <Button size="sm" className="bg-accent text-accent-foreground font-black h-10 px-5 shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all">
                <Heart className="h-4 w-4 mr-2 fill-current" />
                {t.navDonate}
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="flex lg:hidden items-center gap-1.5 sm:gap-3 shrink-0 ml-2">
          <div className="hidden xs:block">
            <LanguageSwitcher />
          </div>
          <AdminButton isMobile />
          <AuthButtons isMobile />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 bg-secondary/50 rounded-xl">
                <Menu className="h-6 w-6 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col p-0 border-l-primary/10">
              <div className="h-20 flex items-center px-6 border-b bg-gradient-to-r from-amber-50 to-white">
                <SheetTitle className={cn("font-bold text-lg truncate text-left", language === 'hi' && "font-hindi")}>{siteName}</SheetTitle>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-6">
                {navItems.map((item) => (
                  <Link 
                    key={item.label} 
                    href={item.href} 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className={cn(
                      "block py-5 text-lg font-bold border-b border-border/50 hover:text-primary transition-colors",
                      language === 'hi' && "font-hindi text-xl"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="xs:hidden py-8 border-b border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
                    {language === 'hi' ? 'भाषा चुनें' : 'Choose Language'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant={language === 'hi' ? 'default' : 'outline'} 
                      className={cn("h-12 rounded-xl font-bold", language === 'hi' && "bg-primary text-primary-foreground font-hindi text-lg")}
                      onClick={() => setLanguage('hi')}
                    >
                      हिंदी
                    </Button>
                    <Button 
                      variant={language === 'en' ? 'default' : 'outline'} 
                      className={cn("h-12 rounded-xl font-bold", language === 'en' && "bg-primary text-primary-foreground")}
                      onClick={() => setLanguage('en')}
                    >
                      English
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t bg-secondary/30 flex flex-col gap-3">
                <Link href="/donate" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full h-14 bg-accent text-accent-foreground font-black text-lg shadow-xl shadow-accent/10 rounded-2xl">
                    <Heart className="h-6 w-6 mr-2 fill-current" /> {t.navDonate}
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
