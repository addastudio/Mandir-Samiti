
"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ArrowDown } from "lucide-react";

export function HeroSection() {
  const { t, language } = useLanguage();
  const heroImage = PlaceHolderImages.find((img) => img.id === "hero-background");

  return (
    <section
      id="home"
      className="relative flex h-screen min-h-[600px] sm:min-h-[700px] w-full items-center justify-center text-center text-white overflow-hidden"
    >
      {/* Background Video (Drone Footage Placeholder) */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster={heroImage?.imageUrl}
        className="absolute inset-0 z-0 h-full w-full object-cover scale-105"
      >
        <source 
          src="https://assets.mixkit.co/videos/preview/mixkit-top-view-of-a-temple-complex-in-india-40000-large.mp4" 
          type="video/mp4" 
        />
        {/* Secondary fallback if video fails to render */}
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={language === 'hi' ? 'भोर में मंदिर की शांत पृष्ठभूमि छवि।' : heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
      </video>

      {/* Darkened Overlay for Text Legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-amber-900/30 z-1" />
      
      <div className="relative z-10 flex flex-col items-center p-4 sm:p-6">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1
            className={cn(
              "text-4xl xs:text-5xl font-bold tracking-tight text-white drop-shadow-2xl sm:text-6xl md:text-7xl lg:text-8xl",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            {t.heroHeadline}
          </h1>
          <p
            className={cn(
              "mt-4 sm:mt-6 max-w-3xl text-lg sm:text-xl md:text-2xl text-gray-100 drop-shadow-lg px-4 font-medium opacity-90",
              language === "hi" ? "font-hindi" : ""
            )}
          >
            {t.heroSubtitle}
          </p>
          
          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto px-6 sm:px-0">
            <a href="#donate" className="w-full sm:w-auto">
              <Button
                size="lg"
                className={cn(
                  "w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base sm:text-lg transition-all hover:scale-105 h-12 sm:h-16 font-bold rounded-xl shadow-2xl",
                  language === "hi" ? "font-hindi text-xl" : ""
                )}
              >
                {t.heroBtnDonate}
              </Button>
            </a>
            <a href="#about" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className={cn(
                  "w-full border-white/40 border-2 text-white bg-white/10 backdrop-blur-md hover:bg-white/20 text-base sm:text-lg transition-all hover:scale-105 h-12 sm:h-16 font-bold rounded-xl",
                  language === "hi" ? "font-hindi text-xl" : ""
                )}
              >
                {t.heroBtnLearnMore}
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 z-10">
        <a href="#about" aria-label="Scroll down" className="flex flex-col items-center gap-2 group">
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/50 group-hover:text-white transition-colors">
            {language === 'hi' ? 'नीचे जाएँ' : 'Discover'}
          </span>
          <ArrowDown className="h-6 w-6 sm:h-8 sm:w-8 animate-bounce text-white/70 group-hover:text-white transition-colors" />
        </a>
      </div>
    </section>
  );
}
