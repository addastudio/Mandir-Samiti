"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

export function EventsSection() {
  const { t, language } = useLanguage();
  const firestore = useFirestore();

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "events");
  }, [firestore]);

  const { data: firebaseEvents, isLoading } = useCollection(eventsQuery);

  const festivals = [
    { name: t.festivalNavratri, imageId: "event-navratri" },
    { name: t.festivalJanmashtami, imageId: "event-janmashtami" },
    { name: t.festivalShivratri, imageId: "event-shivratri" },
    { name: t.festivalDiwali, imageId: "event-diwali" },
  ];

  return (
    <section id="events" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-4xl font-bold tracking-tight sm:text-5xl text-text-accent flex items-center justify-center gap-3",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            <Calendar className="h-8 w-8" />
            {t.eventsTitle}
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle
                className={cn(
                    "mb-4 flex items-center gap-2 text-2xl font-semibold",
                    language === "hi" ? "font-hindi" : "font-headline"
                )}
                >
                <Clock className="h-6 w-6 text-primary" /> {t.eventsDailyPuja}
                </CardTitle>
            </CardHeader>
            <CardContent>
              <ul
                className={cn(
                  "space-y-2 text-muted-foreground text-lg",
                  language === "hi" ? "font-hindi" : ""
                )}
              >
                <li>{t.pujaTimeMorning}</li>
                <li>{t.pujaTimeEvening}</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
             <CardHeader>
                <CardTitle
                className={cn(
                    "mb-4 flex items-center gap-2 text-2xl font-semibold",
                    language === "hi" ? "font-hindi" : "font-headline"
                )}
                >
                <Calendar className="h-6 w-6 text-primary" /> Upcoming Events
                </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 animate-spin" /> Loading live events...
                </div>
              ) : firebaseEvents && firebaseEvents.length > 0 ? (
                <ul className="space-y-3">
                  {firebaseEvents.slice(0, 3).map((event) => (
                    <li key={event.id} className="flex flex-col border-b pb-2 last:border-0">
                      <span className="font-bold text-foreground">{event.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground italic">
                  <AlertCircle className="h-4 w-4" /> No live events currently scheduled.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-20">
          <h3 className={cn("text-2xl font-bold text-center mb-10", language === 'hi' ? 'font-hindi' : 'font-headline')}>
            {t.eventsAnnual}
          </h3>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {festivals.map((festival) => {
              const image = PlaceHolderImages.find(
                (img) => img.id === festival.imageId
              );
              return (
                <Card key={festival.name} className="overflow-hidden group shadow-lg">
                  <div className="relative aspect-[4/3]">
                    {image && (
                      <Image
                        src={image.imageUrl}
                        alt={language === 'hi' ? `${festival.name} उत्सव` : `${festival.name} festival`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={image.imageHint}
                      />
                    )}
                  </div>
                  <div className="p-4 bg-card">
                    <h4
                      className={cn(
                        "text-center font-semibold text-lg",
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
      </div>
    </section>
  );
}
