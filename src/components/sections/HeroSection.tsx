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
      className="relative flex h-screen min-h-[700px] w-full items-center justify-center text-center text-white"
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
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex flex-col items-center p-4">
        <h1
          className={cn(
            "text-5xl font-bold tracking-tight text-white drop-shadow-md sm:text-6xl md:text-7xl",
            language === "hi" ? "font-hindi" : "font-headline"
          )}
        >
          {t.heroHeadline}
        </h1>
        <p
          className={cn(
            "mt-6 max-w-2xl text-xl text-gray-200 drop-shadow-sm md:text-2xl",
            language === "hi" ? "font-hindi" : ""
          )}
        >
          {t.heroSubtitle}
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a href="#donate">
            <Button
              size="lg"
              className={cn(
                "bg-accent text-accent-foreground hover:bg-accent/90 text-lg",
                language === "hi" ? "font-hindi" : ""
              )}
            >
              {t.heroBtnDonate}
            </Button>
          </a>
          <a href="#about">
            <Button
              size="lg"
              variant="outline"
              className={cn(
                "border-white text-white hover:bg-white/10 text-lg",
                language === "hi" ? "font-hindi" : ""
              )}
            >
              {t.heroBtnLearnMore}
            </Button>
          </a>
        </div>
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <a href="#about" aria-label="Scroll down">
          <ArrowDown className="h-8 w-8 animate-bounce text-white/70" />
        </a>
      </div>
    </section>
  );
}
