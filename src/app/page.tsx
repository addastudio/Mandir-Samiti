
"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelectorModal } from "@/components/LanguageSelectorModal";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { NoticeSection } from "@/components/sections/NoticeSection";
import { EventsSection } from "@/components/sections/EventsSection";
import { SevaSection } from "@/components/sections/SevaSection";
import { DonateSection } from "@/components/sections/DonateSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { ContactSection } from "@/components/sections/ContactSection";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const { isLangLoading, language } = useLanguage();

  if (isLangLoading) {
    return <div className="fixed inset-0 bg-background flex items-center justify-center">
      <Skeleton className="h-screen w-screen" />
    </div>;
  }

  return (
    <div className={cn("bg-background", language === "hi" && "font-hindi")}>
      <LanguageSelectorModal />
      <Header />
      <main className="animate-in fade-in duration-500">
        <HeroSection />
        <NoticeSection />
        <AboutSection />
        <Separator />
        <EventsSection />
        <Separator />
        <SevaSection />
        <Separator />
        <DonateSection />
        <Separator />
        <GallerySection />
        <Separator />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
