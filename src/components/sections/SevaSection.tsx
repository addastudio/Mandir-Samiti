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
    <section id="seva" className="bg-secondary py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-4xl font-bold tracking-tight sm:text-5xl text-text-accent flex items-center justify-center gap-3",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            <UtensilsCrossed className="h-8 w-8" />
            {t.sevaTitle}
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {sevaPrograms.map((program, index) => (
            <Card key={index} className="text-center shadow-lg">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <program.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle
                  className={cn("pt-4 text-2xl", language === "hi" ? "font-hindi" : "")}
                >
                  {program.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription
                  className={cn("text-base", language === "hi" ? "font-hindi" : "")}
                >
                  {program.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-20">
          <h3
            className={cn(
              "mb-8 text-center text-3xl font-bold",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            {t.testimonialsTitle}
          </h3>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-4xl mx-auto"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => {
                const image = PlaceHolderImages.find(
                  (img) => img.id === testimonial.imageId
                );
                return (
                  <CarouselItem
                    key={index}
                    className="md:basis-1/2 lg:basis-1/3"
                  >
                    <div className="p-1 h-full">
                      <Card className="h-full flex flex-col shadow-lg">
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center flex-grow">
                          <p
                            className={cn(
                              "italic text-muted-foreground mb-4 flex-grow",
                              language === "hi" ? "font-hindi" : ""
                            )}
                          >
                            &ldquo;{testimonial.quote}&rdquo;
                          </p>
                           <div className="flex items-center gap-3 mt-auto">
                             <Avatar>
                                {image && <AvatarImage src={image.imageUrl} alt={testimonial.name} data-ai-hint={image.imageHint}/>}
                               <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                             </Avatar>
                             <p
                                className={cn(
                                  "font-semibold",
                                  language === "hi" ? "font-hindi" : ""
                                )}
                              >
                                {testimonial.name}
                              </p>
                           </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
