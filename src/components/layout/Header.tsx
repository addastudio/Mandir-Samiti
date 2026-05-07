
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, LogIn, LayoutDashboard, Heart, User as UserIcon, ShieldCheck } from "lucide-react";
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
    { href: "/#seva", label: t.navSeva, isAnchor: true },
    { href: "/prayer-request", label: t.navPrayer, isAnchor: false },
    { href: "/donate", label: t.navDonate, isAnchor: false },
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
      } else {
        setActiveSection(pathname.replace('/', ''));
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navItems, pathname]);

  const AuthButton = ({ className, isMobile = false }: { className?: string; isMobile?: boolean }) => {
    if (isUserLoading) {
      return <div className={cn("h-10 w-10 animate-pulse rounded-full bg-muted", className)} />;
    }
    if (user) {
      return (
        <Link href="/dashboard" className={className} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
          <Avatar className="h-10 w-10 border-2 border-primary shadow-sm hover:scale-110 transition-all cursor-pointer">
            <AvatarImage src={user.photoURL || userProfile?.photoURL || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
              <UserIcon className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
        </Link>
      );
    }
    return (
      <Link href="/login" className={className} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
        <Button variant="ghost" size="sm" className="gap-2 w-full justify-start md:justify-center">
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
      {navItems.map((item) => {
        const isActive = pathname === '/' 
          ? (item.isAnchor && activeSection === item.href.replace('/#', ''))
          : (pathname === item.href || (pathname.startsWith('/gallery') && item.href === '/gallery'));

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "relative px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
              isActive ? "text-primary" : "text-muted-foreground",
              isMobile && "w-full py-4 text-lg border-b border-border/50",
              itemClassName,
              language === "hi" ? "font-hindi" : ""
            )}
          >
            {item.label}
            {!isMobile && isActive && (
              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary animate-in fade-in slide-in-from-bottom-1" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-500",
        isScrolled || pathname !== '/'
          ? "border-b border-border/40 bg-background/80 shadow-sm backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 group">
          <div className="flex items-center gap-2 lg:gap-3 rounded-lg lg:rounded-xl bg-amber-50 px-2 py-1.5 sm:px-3 lg:px-4 lg:py-2.5 shadow-sm ring-1 ring-primary/20 backdrop-blur-sm transition-colors group-hover:bg-amber-100">
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 overflow-hidden rounded-full border border-primary/20 bg-white flex items-center justify-center shadow-inner">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                fill 
                className="object-contain p-0.5 z-10"
                onError={(e) => {
                  (e.target as any).style.opacity = '0';
                }}
              />
              <TempleIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary absolute" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span
                className={cn(
                  "text-base sm:text-lg lg:text-xl font-bold text-foreground",
                  language === "hi" ? "font-hindi" : "font-headline"
                )}
              >
                {language === "hi" ? "मंदिर समिति" : "Mandir Samiti"}
              </span>
              <span className="text-[8px] sm:text-[9px] lg:text-[10px] uppercase tracking-widest text-muted-foreground font-bold opacity-80">
                {language === "hi" ? "बहपुरा" : "Bahpura"}
              </span>
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-4 lg:flex">
          <NavLinks />
          <div className="h-6 w-px bg-border/60" />
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="flex items-center gap-2">
              {adminDoc && (
                <Link href="/management">
                  <Button 
                    variant="default" 
                    size="icon" 
                    className="bg-primary text-primary-foreground h-10 w-10 rounded-full shadow-lg hover:scale-110 hover:bg-primary/90 transition-all border-2 border-white" 
                    title={language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel'}
                  >
                    <ShieldCheck className="h-6 w-6 stroke-[2.5px]" />
                  </Button>
                </Link>
              )}
              <AuthButton />
            </div>
            <Link href="/donate">
              <Button size="sm" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <Heart className="h-4 w-4 fill-current" />
                <span className={cn(language === "hi" ? "font-hindi" : "")}>
                  {t.navDonate}
                </span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 lg:hidden">
          <div className="hidden xs:block">
            <LanguageSwitcher />
          </div>
          <div className="flex items-center gap-1">
            {adminDoc && (
              <Link href="/management">
                <Button 
                  variant="default" 
                  size="icon" 
                  className="bg-primary text-primary-foreground h-10 w-10 rounded-full shadow-lg active:scale-95 hover:bg-primary/90 transition-all border-2 border-white" 
                  title={language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel'}
                >
                  <ShieldCheck className="h-6 w-6 stroke-[2.5px]" />
                </Button>
              </Link>
            )}
            <AuthButton className="flex" />
          </div>
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

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <NavLinks
                  className="flex-col items-start gap-0"
                  isMobile
                />
                {adminDoc && (
                   <Link 
                    href="/management" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 w-full py-4 text-lg border-b border-border/50 text-primary font-bold",
                      language === "hi" ? "font-hindi" : ""
                    )}
                   >
                     <ShieldCheck className="h-6 w-6" />
                     {language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel'}
                   </Link>
                )}
              </div>

              <div className="border-t bg-secondary/30 p-6 space-y-4">
                <div className="flex items-center justify-between xs:hidden">
                   <span className="text-sm font-medium text-muted-foreground">
                    {language === 'hi' ? 'भाषा' : 'Language'}
                  </span>
                  <LanguageSwitcher />
                </div>
                <Link href="/donate" onClick={() => setIsMobileMenuOpen(false)} className="block">
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
