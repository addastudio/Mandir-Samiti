"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

export function EventsSection() {
  const { t, language } = useLanguage();

  const festivals = [
    { name: t.festivalNavratri, imageId: "event-navratri" },
    { name: t.festivalJanmashtami, imageId: "event-janmashtami" },
    { name: t.festivalShivratri, imageId: "event-shivratri" },
    { name: t.festivalDiwali, imageId: "event-diwali" },
  ];

  return (
    <section id="events" className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-3xl font-bold tracking-tight sm:text-4xl",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            {t.eventsTitle}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <h3
                className={cn(
                  "mb-4 flex items-center gap-2 text-xl font-semibold",
                  language === "hi" ? "font-hindi" : "font-headline"
                )}
              >
                <Clock className="h-6 w-6 text-primary" /> {t.eventsDailyPuja}
              </h3>
              <ul
                className={cn(
                  "space-y-2 text-muted-foreground",
                  language === "hi" ? "font-hindi" : ""
                )}
              >
                <li>{t.pujaTimeMorning}</li>
                <li>{t.pujaTimeEvening}</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3
                className={cn(
                  "mb-4 flex items-center gap-2 text-xl font-semibold",
                  language === "hi" ? "font-hindi" : "font-headline"
                )}
              >
                <Calendar className="h-6 w-6 text-primary" /> {t.eventsAnnual}
              </h3>
              <ul
                className={cn(
                  "grid grid-cols-2 gap-2 text-muted-foreground",
                  language === "hi" ? "font-hindi" : ""
                )}
              >
                {festivals.map((festival, index) => (
                  <li key={index}>{festival.name}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {festivals.map((festival) => {
            const image = PlaceHolderImages.find(
              (img) => img.id === festival.imageId
            );
            return (
              <Card key={festival.name} className="overflow-hidden group">
                <div className="relative aspect-w-4 aspect-h-3">
                  {image && (
                    <Image
                      src={image.imageUrl}
                      alt={festival.name}
                      width={400}
                      height={300}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={image.imageHint}
                    />
                  )}
                </div>
                <div className="p-4">
                  <h4
                    className={cn(
                      "text-center font-medium",
                      language === "hi" ? "font-hindi" : ""
                    )}
                  >
                    {festival.name}
                  </h4>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
