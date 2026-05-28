"use client";

import * as React from "react";
import dynamic from 'next/dynamic';
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelectorModal } from "@/components/LanguageSelectorModal";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/sections/HeroSection";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

/**
 * Optimized Section Loading
 * We use dynamic imports for sections below the fold to reduce the initial JS payload.
 */
const NoticeSection = dynamic(() => import("@/components/sections/NoticeSection").then(mod => mod.NoticeSection), { 
  ssr: true,
  loading: () => <div className="h-40 bg-muted/5 animate-pulse rounded-xl m-4" /> 
});
const AboutSection = dynamic(() => import("@/components/sections/AboutSection").then(mod => mod.AboutSection), { 
  ssr: true,
  loading: () => <div className="h-96 bg-muted/5 animate-pulse rounded-xl m-4" /> 
});
const EventsSection = dynamic(() => import("@/components/sections/EventsSection").then(mod => mod.EventsSection), { 
  ssr: true,
  loading: () => <div className="h-96 bg-muted/5 animate-pulse rounded-xl m-4" /> 
});
const SevaSection = dynamic(() => import("@/components/sections/SevaSection").then(mod => mod.SevaSection), { 
  ssr: true,
  loading: () => <div className="h-96 bg-muted/5 animate-pulse rounded-xl m-4" /> 
});
const PrayerRequestSection = dynamic(() => import("@/components/sections/PrayerRequestSection").then(mod => mod.PrayerRequestSection), { 
  ssr: true,
  loading: () => <div className="h-96 bg-muted/5 animate-pulse rounded-xl m-4" /> 
});
const GallerySection = dynamic(() => import("@/components/sections/GallerySection").then(mod => mod.GallerySection), { 
  ssr: true,
  loading: () => <div className="h-96 bg-muted/5 animate-pulse rounded-xl m-4" /> 
});
const ContactSection = dynamic(() => import("@/components/sections/ContactSection").then(mod => mod.ContactSection), { 
  ssr: true,
  loading: () => <div className="h-96 bg-muted/5 animate-pulse rounded-xl m-4" /> 
});

export default function Home() {
  const { isLangLoading, language } = useLanguage();

  return (
    <div className={cn("bg-background min-h-screen", language === "hi" && "font-hindi")}>
      <LanguageSelectorModal />
      <Header />
      <main id="main-content">
        <HeroSection />
        
        <div className={cn("transition-opacity duration-1000", isLangLoading ? "opacity-50" : "opacity-100")}>
          <NoticeSection />
          <AboutSection />
          <Separator />
          <EventsSection />
          <Separator />
          <SevaSection />
          <Separator />
          {/* Donation Section is muted per user request */}
          {/* <DonateSection /> */}
          {/* <Separator /> */}
          <PrayerRequestSection />
          <Separator />
          <GallerySection />
          <Separator />
          <ContactSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
