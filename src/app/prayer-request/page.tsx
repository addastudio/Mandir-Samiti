"use client";

import * as React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PrayerRequestSection } from "@/components/sections/PrayerRequestSection";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

/**
 * Dedicated page for devotees to submit prayer and ritual requests.
 * Uses the existing PrayerRequestSection component for a consistent UI.
 */
export default function PrayerRequestPage() {
  const { language, t } = useLanguage();

  return (
    <div className={cn("bg-background min-h-screen flex flex-col", language === "hi" && "font-hindi")}>
      <Header />
      <main id="main-content" className="flex-grow pt-24 pb-12 sm:pt-32">
        <div className="container mx-auto px-4 mb-8">
          <Breadcrumbs items={[{ label: t.navPrayer }]} />
        </div>
        
        {/* Reuse the specialized section component */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <PrayerRequestSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
