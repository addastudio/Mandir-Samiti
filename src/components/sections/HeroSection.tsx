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
      className="relative flex h-screen min-h-[600px] sm:min-h-[700px] w-full items-center justify-center text-center text-white"
    >
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-amber-900/40" />
      <div className="relative z-10 flex flex-col items-center p-4 sm:p-6">
        <h1
          className={cn(
            "text-4xl xs:text-5xl font-bold tracking-tight text-white drop-shadow-md sm:text-6xl md:text-7xl",
            language === "hi" ? "font-hindi" : "font-headline"
          )}
        >
          {t.heroHeadline}
        </h1>
        <p
          className={cn(
            "mt-4 sm:mt-6 max-w-2xl text-lg sm:text-xl md:text-2xl text-gray-200 drop-shadow-sm px-4",
            language === "hi" ? "font-hindi" : ""
          )}
        >
          {t.heroSubtitle}
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-6 sm:px-0">
          <a href="#donate" className="w-full sm:w-auto">
            <Button
              size="lg"
              className={cn(
                "w-full bg-accent text-accent-foreground hover:bg-accent/90 text-base sm:text-lg transition-transform hover:scale-105 h-12 sm:h-14",
                language === "hi" ? "font-hindi" : ""
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
                "w-full border-white border-2 text-white bg-transparent hover:bg-white/10 text-base sm:text-lg transition-transform hover:scale-105 h-12 sm:h-14",
                language === "hi" ? "font-hindi" : ""
              )}
            >
              {t.heroBtnLearnMore}
            </Button>
          </a>
        </div>
      </div>
      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2">
        <a href="#about" aria-label="Scroll down">
          <ArrowDown className="h-6 w-6 sm:h-8 sm:w-8 animate-bounce text-white/70" />
        </a>
      </div>
    </section>
  );
}
