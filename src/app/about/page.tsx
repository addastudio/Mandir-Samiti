
"use client";

import * as React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AboutSection } from "@/components/sections/AboutSection";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Loader2, History, Target, Users } from "lucide-react";
import { Suspense } from "react";

/**
 * Dedicated About Us page.
 * Reuses the AboutSection logic but wraps it in a full-page layout
 * with proper navigation and breadcrumbs.
 */
function AboutPageContent() {
  const { language, t } = useLanguage();

  return (
    <div className={cn("bg-background min-h-screen flex flex-col", language === "hi" && "font-hindi")}>
      <Header />
      <main id="main-content" className="flex-grow pt-24 pb-12 sm:pt-32">
        <div className="container mx-auto px-4 mb-8">
          <Breadcrumbs items={[{ label: t.navAbout }]} />
        </div>
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* We use the AboutSection component which is already optimized for both home and sub-pages */}
          <AboutSection />
        </div>

        {/* Additional information or purely decorative elements for the dedicated page could go here */}
        <div className="container mx-auto px-4 mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-primary/5 p-8 rounded-2xl border border-primary/10 text-center space-y-4">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <History className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-bold text-lg">{language === 'hi' ? 'हमारी विरासत' : 'Our Heritage'}</h4>
              <p className="text-sm text-muted-foreground">{language === 'hi' ? 'पीढ़ियों से चली आ रही परंपराओं का संरक्षण।' : 'Preserving traditions passed down through generations.'}</p>
            </div>
            <div className="bg-accent/5 p-8 rounded-2xl border border-accent/10 text-center space-y-4">
              <div className="h-12 w-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <Target className="h-6 w-6 text-accent" />
              </div>
              <h4 className="font-bold text-lg">{language === 'hi' ? 'हमारा लक्ष्य' : 'Our Goal'}</h4>
              <p className="text-sm text-muted-foreground">{language === 'hi' ? 'समाज में आध्यात्मिक जागरूकता और सेवा को बढ़ावा देना।' : 'Promoting spiritual awareness and service in society.'}</p>
            </div>
            <div className="bg-secondary p-8 rounded-2xl border border-border/50 text-center space-y-4">
              <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <h4 className="font-bold text-lg">{language === 'hi' ? 'सामुदायिक एकता' : 'Community Unity'}</h4>
              <p className="text-sm text-muted-foreground">{language === 'hi' ? 'सभी को एक सूत्र में बांधने वाला पवित्र स्थान।' : 'A sacred space that binds everyone together.'}</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <AboutPageContent />
    </Suspense>
  );
}
