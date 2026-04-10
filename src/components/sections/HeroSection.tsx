
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
      className="relative flex min-h-[100dvh] w-full items-center justify-center text-center text-white overflow-hidden"
    >
      {/* Background Video (Drone Footage Placeholder) */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster={heroImage?.imageUrl}
        className="absolute inset-0 z-0 h-full w-full object-cover"
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

      {/* Darkened Overlay for Text Legibility - Multi-layered for better contrast */}
      <div className="absolute inset-0 bg-black/40 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 z-[2]" />
      
      <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 w-full max-w-6xl mx-auto py-20 sm:py-0">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1
            className={cn(
              "text-3xl xs:text-4xl font-bold tracking-tight text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1]",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            {t.heroHeadline}
          </h1>
          <p
            className={cn(
              "mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-lg md:text-xl lg:text-2xl text-gray-100 drop-shadow-lg font-medium opacity-90 leading-relaxed",
              language === "hi" ? "font-hindi" : ""
            )}
          >
            {t.heroSubtitle}
          </p>
          
          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full sm:w-auto max-w-[280px] sm:max-w-none mx-auto">
            <a href="#donate" className="w-full sm:w-auto">
              <Button
                size="lg"
                className={cn(
                  "w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base sm:text-lg transition-all hover:scale-105 h-12 sm:h-16 px-8 font-bold rounded-xl shadow-2xl",
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
                  "w-full border-white/40 border-2 text-white bg-white/10 backdrop-blur-md hover:bg-white/20 text-base sm:text-lg transition-all hover:scale-105 h-12 sm:h-16 px-8 font-bold rounded-xl",
                  language === "hi" ? "font-hindi text-xl" : ""
                )}
              >
                {t.heroBtnLearnMore}
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 group cursor-pointer">
        <a href="#notices" aria-label="Scroll down" className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/60 group-hover:text-white transition-colors">
            {language === 'hi' ? 'नीचे जाएँ' : 'Discover'}
          </span>
          <ArrowDown className="h-5 w-5 sm:h-6 sm:w-6 animate-bounce text-white/80 group-hover:text-white transition-colors" />
        </a>
      </div>
    </section>
  );
}
