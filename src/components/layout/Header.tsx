"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, LogIn, Heart, User as UserIcon, ShieldCheck, UserPlus } from "lucide-react";
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
  const { t, language, settings } = useLanguage();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("home");
  const [logoError, setLogoError] = React.useState(false);

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

  const navItems = React.useMemo(() => [
    { id: "home", href: "/#home", label: t.navHome, isAnchor: true },
    { id: "notices", href: "/#notices", label: t.noticesTitle, isAnchor: true },
    { id: "about", href: "/about", label: t.navAbout, isAnchor: false },
    { id: "events", href: "/#events", label: t.navEvents, isAnchor: true },
    { id: "gallery", href: "/gallery", label: t.navGallery, isAnchor: false },
    { id: "contact", href: "/#contact", label: t.navContact, isAnchor: true },
  ], [t]);

  const isTransparent = !isScrolled && pathname === '/';

  // Optimized Scroll Listener (Throttled)
  React.useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      if (scrolled !== isScrolled) {
        setIsScrolled(scrolled);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolled]);

  // Optimized Active Section (Intersection Observer)
  React.useEffect(() => {
    if (pathname !== '/') return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    navItems.filter(item => item.isAnchor).forEach(item => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
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
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "h-9 px-2 sm:px-4 transition-colors",
              isTransparent ? "text-white hover:bg-white/10" : "text-foreground hover:bg-secondary"
            )}
          >
            <LogIn className="h-4 w-4 sm:mr-2" />
            <span className={cn("hidden sm:inline text-xs sm:text-sm", language === "hi" && "font-hindi")}>{t.navLogin}</span>
          </Button>
        </Link>
        <Link href="/signup" onClick={() => isMobile && setIsMobileMenuOpen(false)} className="shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-9 px-2 sm:px-4 transition-colors",
              isTransparent ? "border-white/40 text-white hover:bg-white/10" : "border-primary/20 text-foreground hover:bg-primary/5"
            )}
          >
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
      isScrolled || pathname !== '/' ? "border-b bg-background/95 backdrop-blur-md shadow-sm py-2" : "bg-transparent py-4"
    )}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <Link href="/" className="flex items-center min-w-0 group shrink-0">
          <div className={cn(
            "flex items-center gap-2 lg:gap-4 rounded-2xl px-2.5 py-2 transition-all duration-300",
            isTransparent 
              ? "bg-white/10 backdrop-blur-md border border-white/20 shadow-none hover:bg-white/20" 
              : "bg-white/40 md:bg-amber-50/80 shadow-sm border border-primary/10 hover:bg-white/60"
          )}>
            <div className="relative h-9 w-9 sm:h-11 sm:w-11 overflow-hidden rounded-full bg-white shrink-0 flex items-center justify-center border border-primary/10 shadow-inner">
              {settings?.favicon && !logoError ? (
                <Image 
                  src={settings.favicon} 
                  alt="Logo" 
                  fill 
                  className="object-contain p-1.5" 
                  priority
                  onError={() => setLogoError(true)} 
                />
              ) : (
                <TempleIcon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              )}
            </div>
            <div className="flex flex-col justify-center min-w-0 pt-0.5">
              <span className={cn(
                "text-sm sm:text-base lg:text-xl font-extrabold truncate tracking-tight transition-colors duration-300", 
                isTransparent ? "text-white" : "text-foreground",
                language === "hi" ? "font-hindi leading-snug" : "font-headline leading-none"
              )}>
                {siteName}
              </span>
              <span className={cn(
                "text-[7px] sm:text-[9px] uppercase tracking-[0.15em] font-black hidden xs:block truncate mt-0.5 transition-colors duration-300",
                isTransparent ? "text-white/70" : "text-muted-foreground opacity-80",
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
            {navItems.map((item) => {
              const isActive = pathname === '/' 
                ? activeSection === item.id
                : pathname === item.href;

              return (
                <Link key={item.label} href={item.href} className={cn(
                  "px-3 py-2 text-sm font-bold transition-all hover:scale-105",
                  isActive 
                    ? "text-primary bg-primary/5 rounded-lg" 
                    : isTransparent 
                      ? "text-white/80 hover:text-white" 
                      : "text-muted-foreground hover:text-primary",
                  language === 'hi' && "font-hindi text-base"
                )}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className={cn(
            "flex items-center gap-4 border-l pl-6 ml-2 transition-colors duration-300",
            isTransparent ? "border-white/20" : "border-primary/10"
          )}>
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
              <Button variant="ghost" size="icon" className={cn(
                "h-10 w-10 rounded-xl",
                isTransparent ? "bg-white/10 text-white" : "bg-secondary/50 text-primary"
              )}>
                <Menu className="h-6 w-6" />
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
