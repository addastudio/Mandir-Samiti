"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";

export function HeroSection() {
  const { t, language } = useLanguage();
  const [cmsHero, setCmsHero] = useState<any>(null);
  const heroImage = PlaceHolderImages.find((img) => img.id === "hero-background");

  useEffect(() => {
    fetch('/api/content/hero')
      .then(res => res.json())
      .then(data => setCmsHero(data))
      .catch(() => setCmsHero(null));
  }, []);

  const headline = language === 'hi' 
    ? (cmsHero?.headline_hi || t.heroHeadline)
    : (cmsHero?.headline_en || t.heroHeadline);

  const subtitle = language === 'hi'
    ? (cmsHero?.subtitle_hi || t.heroSubtitle)
    : (cmsHero?.subtitle_en || t.heroSubtitle);

  const videoUrl = cmsHero?.video_url || "https://assets.mixkit.co/videos/preview/kit-top-view-of-a-temple-complex-in-india-40000-large.mp4";
  const bgImage = cmsHero?.fallback_image || heroImage?.imageUrl;

  return (
    <section
      id="home"
      className="relative flex min-h-[100dvh] w-full items-center justify-center text-center text-white overflow-hidden"
    >
      {/* Layer 1: Fallback Image */}
      {bgImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={bgImage}
            alt="Hero Background"
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Layer 2: Video Overlay */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 z-[1] h-full w-full object-cover opacity-80"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Layer 3: Dark Overlays */}
      <div className="absolute inset-0 bg-black/40 z-[2]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 z-[3]" />
      
      {/* Layer 4: Content */}
      <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 w-full max-w-6xl mx-auto py-20 sm:py-0">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1
            className={cn(
              "text-3xl xs:text-4xl font-bold tracking-tight text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1]",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            {headline}
          </h1>
          <p
            className={cn(
              "mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-lg md:text-xl lg:text-2xl text-gray-100 drop-shadow-lg font-medium opacity-90 leading-relaxed",
              language === "hi" ? "font-hindi" : ""
            )}
          >
            {subtitle}
          </p>
          
          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full sm:w-auto max-w-[280px] sm:max-w-none mx-auto">
            <Link href="/donate" className="w-full sm:w-auto">
              <Button
                size="lg"
                className={cn(
                  "w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base sm:text-lg transition-all hover:scale-105 h-12 sm:h-16 px-8 font-bold rounded-xl shadow-2xl",
                  language === "hi" ? "font-hindi text-xl" : ""
                )}
              >
                {t.heroBtnDonate}
              </Button>
            </Link>
            <Link href="/about" className="w-full sm:w-auto">
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
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[10] flex flex-col items-center gap-2 group cursor-pointer">
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
