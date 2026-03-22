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
} from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React from "react";

export function SevaSection() {
  const { t, language } = useLanguage();

  const sevaPrograms = [
    {
      title: t.sevaBhandara,
      description: t.sevaBhandaraDesc,
      icon: UtensilsCrossed,
    },
    {
      title: t.sevaHealth,
      description: t.sevaHealthDesc,
      icon: HeartHandshake,
    },
    {
      title: t.sevaCharity,
      description: t.sevaCharityDesc,
      icon: BookOpenCheck,
    },
  ];

  const testimonials = [
    {
      quote: t.testimonial1,
      name: t.testimonial1Name,
      imageId: "testimonial-1",
    },
    {
      quote: t.testimonial2,
      name: t.testimonial2Name,
      imageId: "testimonial-2",
    },
    {
      quote: t.testimonial3,
      name: t.testimonial3Name,
      imageId: "testimonial-3",
    },
  ];

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
          {sevaPrograms.map((program, index) => (
            <Card key={index} className="text-center shadow-lg border-primary/5 hover:border-primary/20 transition-colors">
              <CardHeader className="p-5 sm:p-6">
                <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
                  <program.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
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
          ))}
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
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {testimonials.map((testimonial, index) => {
                  const image = PlaceHolderImages.find(
                    (img) => img.id === testimonial.imageId
                  );
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
                                {image && <AvatarImage src={image.imageUrl} alt={testimonial.name} data-ai-hint={image.imageHint}/>}
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
          </div>
        </div>
      </div>
    </section>
  );
}
