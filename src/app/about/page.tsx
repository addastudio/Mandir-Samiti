"use client";

import * as React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AboutSection } from "@/components/sections/AboutSection";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Loader2, History, Target, Users, ShieldCheck, Heart, Sparkles } from "lucide-react";
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
          <AboutSection />
        </div>

        <div className="container mx-auto px-4 mt-20 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[2.5rem] border border-primary/5 shadow-lg shadow-primary/5 text-center space-y-6 hover:shadow-xl transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                <History className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-xl">{language === 'hi' ? 'हमारी विरासत' : 'Our Heritage'}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {language === 'hi' 
                    ? 'दशकों की भक्ति और सेवा के माध्यम से हमारी प्राचीन परंपराओं का संरक्षण और संवर्धन।' 
                    : 'Preserving and promoting our ancient traditions through decades of devotion and selfless service.'}
                </p>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-accent/5 shadow-lg shadow-accent/5 text-center space-y-6 hover:shadow-xl transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-accent" />
              <div className="h-16 w-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                <Target className="h-8 w-8 text-accent" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-xl">{language === 'hi' ? 'हमारा लक्ष्य' : 'Our Goal'}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {language === 'hi' 
                    ? 'समाज में आध्यात्मिक जागरूकता फैलाना और मानवता की निःस्वार्थ सेवा करना।' 
                    : 'Spreading spiritual awareness in society and serving humanity through selfless actions.'}
                </p>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-primary/5 shadow-lg shadow-primary/5 text-center space-y-6 hover:shadow-xl transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-xl">{language === 'hi' ? 'सामुदायिक एकता' : 'Community Unity'}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {language === 'hi' 
                    ? 'एक ऐसा पवित्र स्थान जहाँ हर भक्त को सम्मान और शांति का अनुभव हो।' 
                    : 'A sacred sanctuary where every devotee experiences deep respect, peace, and belonging.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-20 bg-secondary/40 rounded-[3rem] p-8 sm:p-16 border border-white/50 shadow-inner flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-xl space-y-4 text-center md:text-left">
              <h3 className="text-2xl sm:text-4xl font-bold text-text-accent flex items-center justify-center md:justify-start gap-3">
                <ShieldCheck className="h-8 w-8 text-primary" />
                {language === 'hi' ? 'विश्वसनीय प्रबंधन' : 'Trusted Management'}
              </h3>
              <p className="text-muted-foreground text-sm sm:text-lg">
                {language === 'hi' 
                  ? 'मंदिर समिति पूरी पारदर्शिता और समर्पण के साथ मंदिर के विकास के लिए कार्य कर रही है।' 
                  : 'The temple committee operates with full transparency and unwavering dedication to the temple’s growth.'}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white border-4 border-primary/10 flex flex-col items-center justify-center shadow-xl">
                <span className="text-xl sm:text-2xl font-black text-primary">15+</span>
                <span className="text-[8px] uppercase font-bold text-muted-foreground">Years</span>
              </div>
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white border-4 border-accent/10 flex flex-col items-center justify-center shadow-xl">
                <span className="text-xl sm:text-2xl font-black text-accent">10k</span>
                <span className="text-[8px] uppercase font-bold text-muted-foreground">Devotees</span>
              </div>
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
