"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  UtensilsCrossed,
  HeartHandshake,
  BookOpenCheck,
  Users,
  Hand,
  Shield,
  Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useEffect, useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

const SEVA_ICONS = {
  UtensilsCrossed: UtensilsCrossed,
  HeartHandshake: HeartHandshake,
  BookOpenCheck: BookOpenCheck,
  Users: Users,
  Hand: Hand,
  Shield: Shield
};

export function SevaSection() {
  const { t, language } = useLanguage();
  const firestore = useFirestore();
  const [cmsSeva, setCmsSeva] = useState<any[]>([]);
  const [isCmsLoading, setIsCmsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/content/seva')
      .then(res => res.json())
      .then(data => {
        setCmsSeva(Array.isArray(data) ? data : []);
        setIsCmsLoading(false);
      })
      .catch(() => {
        setCmsSeva([]);
        setIsCmsLoading(false);
      });
  }, []);

  const testimonialsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "testimonials");
  }, [firestore]);

  const { data: firebaseTestimonials, isLoading: isTestimonialsLoading } = useCollection(testimonialsRef);

  const fallbackSeva = [
    {
      title: t.sevaBhandara,
      description: t.sevaBhandaraDesc,
      icon: "UtensilsCrossed",
    },
    {
      title: t.sevaHealth,
      description: t.sevaHealthDesc,
      icon: "HeartHandshake",
    },
    {
      title: t.sevaCharity,
      description: t.sevaCharityDesc,
      icon: "BookOpenCheck",
    },
  ];

  const fallbackTestimonials = [
    {
      quote: t.testimonial1,
      name: t.testimonial1Name,
      imageURL: "https://picsum.photos/seed/115/100/100",
    },
    {
      quote: t.testimonial2,
      name: t.testimonial2Name,
      imageURL: "https://picsum.photos/seed/116/100/100",
    },
    {
      quote: t.testimonial3,
      name: t.testimonial3Name,
      imageURL: "https://picsum.photos/seed/117/100/100",
    },
  ];

  const sevaPrograms = cmsSeva.length > 0 ? cmsSeva.map(s => ({
    title: language === 'hi' ? s.title_hi : s.title_en,
    description: language === 'hi' ? s.desc_hi : s.desc_en,
    icon: s.icon
  })) : fallbackSeva;

  const testimonials = firebaseTestimonials && firebaseTestimonials.length > 0 ? firebaseTestimonials : fallbackTestimonials;

  return (
    <section id="seva" className="bg-secondary/50 py-16 sm:py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-3xl xs:text-4xl font-bold tracking-tight sm:text-5xl text-text-accent flex items-center justify-center gap-2 sm:gap-3",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            <UtensilsCrossed className="h-7 w-7 sm:h-8 sm:w-8" />
            {t.sevaTitle}
          </h2>
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
          {isCmsLoading ? (
             Array(3).fill(0).map((_, i) => (
               <Card key={i} className="animate-pulse h-48 bg-white/50 rounded-xl" />
             ))
          ) : (
            sevaPrograms.map((program, index) => {
              const Icon = SEVA_ICONS[program.icon as keyof typeof SEVA_ICONS] || Hand;
              return (
                <Card key={index} className="text-center shadow-lg border-primary/5 hover:border-primary/20 transition-colors group">
                  <CardHeader className="p-5 sm:p-6">
                    <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
                      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <CardTitle
                      className={cn("pt-4 text-xl sm:text-2xl", language === "hi" ? "font-hindi" : "")}
                    >
                      {program.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 sm:p-6 pt-0">
                    <CardDescription
                      className={cn("text-sm sm:text-base leading-relaxed", language === "hi" ? "font-hindi" : "")}
                    >
                      {program.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="mt-16 sm:mt-20 md:mt-24">
          <h3
            className={cn(
              "mb-8 sm:mb-12 text-center text-2xl sm:text-3xl font-bold",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            {t.testimonialsTitle}
          </h3>
          <div className="relative px-8 sm:px-12 max-w-5xl mx-auto">
            {isTestimonialsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {testimonials.map((testimonial, index) => {
                    return (
                      <CarouselItem
                        key={index}
                        className="pl-4 basis-full xs:basis-1/2 lg:basis-1/3"
                      >
                        <Card className="h-full flex flex-col shadow-md border-primary/5">
                          <CardContent className="flex flex-col h-full p-5 sm:p-6">
                            <p
                              className={cn(
                                "italic text-muted-foreground text-sm sm:text-base mb-6 flex-grow",
                                language === "hi" ? "font-hindi" : ""
                              )}
                            >
                              &ldquo;{testimonial.quote}&rdquo;
                            </p>
                             <div className="flex items-center gap-3 mt-auto border-t pt-4">
                               <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                  <AvatarImage src={testimonial.imageURL} alt={testimonial.name} />
                                 <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <p
                                  className={cn(
                                    "font-semibold text-xs sm:text-sm",
                                    language === "hi" ? "font-hindi" : ""
                                  )}
                                >
                                  {testimonial.name}
                                </p>
                             </div>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="-left-4 sm:-left-8" />
                <CarouselNext className="-right-4 sm:-right-8" />
              </Carousel>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
