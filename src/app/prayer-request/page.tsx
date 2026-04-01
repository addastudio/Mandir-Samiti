"use client";

import * as React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PrayerRequestSection } from "@/components/sections/PrayerRequestSection";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Dedicated page for devotees to submit prayer and ritual requests.
 * Uses the existing PrayerRequestSection component for a consistent UI.
 */
export default function PrayerRequestPage() {
  const { language, t } = useLanguage();
  const router = useRouter();

  return (
    <div className={cn("bg-background min-h-screen flex flex-col", language === "hi" && "font-hindi")}>
      <Header />
      <main className="flex-grow pt-24 pb-12 sm:pt-32">
        <div className="container mx-auto px-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/")}
            className="group flex items-center gap-2 px-4 py-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 active:scale-95 font-medium"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t.backToHome}
          </Button>
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
