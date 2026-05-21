"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Public Events Section
 * Lists upcoming festivals and daily puja timings.
 */
export function EventsSection() {
  const { t, language } = useLanguage();
  const firestore = useFirestore();
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  // Query events sorted by date to ensure the most upcoming ones appear first
  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "events"), orderBy("date", "asc"));
  }, [firestore]);

  const { data: firebaseEvents, isLoading } = useCollection(eventsQuery);

  const toggleEvent = (id: string) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const festivals = [
    { name: t.festivalNavratri, imageId: "event-navratri" },
    { name: t.festivalJanmashtami, imageId: "event-janmashtami" },
    { name: t.festivalShivratri, imageId: "event-shivratri" },
    { name: t.festivalDiwali, imageId: "event-diwali" },
  ];

  return (
    <section id="events" className="py-16 sm:py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-3xl xs:text-4xl font-bold tracking-tight sm:text-5xl text-text-accent flex items-center justify-center gap-2 sm:gap-3",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            <Calendar className="h-7 w-7 sm:h-8 sm:w-8" />
            {t.eventsTitle}
          </h2>
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="p-5 sm:p-6">
                <CardTitle
                className={cn(
                    "mb-2 flex items-center gap-2 text-xl sm:text-2xl font-semibold",
                    language === "hi" ? "font-hindi" : "font-headline"
                )}
                >
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> {t.eventsDailyPuja}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 pt-0">
              <ul
                className={cn(
                  "space-y-2 text-muted-foreground text-base sm:text-lg",
                  language === "hi" ? "font-hindi" : ""
                )}
              >
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {t.pujaTimeMorning}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {t.pujaTimeEvening}
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-primary/10">
             <CardHeader className="p-5 sm:p-6">
                <CardTitle
                className={cn(
                    "mb-2 flex items-center gap-2 text-xl sm:text-2xl font-semibold",
                    language === "hi" ? "font-hindi" : "font-headline"
                )}
                >
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> {language === 'hi' ? 'आगामी कार्यक्रम' : 'Upcoming Events'}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 pt-0">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Clock className="h-4 w-4 animate-spin" /> {language === 'hi' ? 'कार्यक्रम लोड हो रहे हैं...' : 'Loading live events...'}
                </div>
              ) : firebaseEvents && firebaseEvents.length > 0 ? (
                <ul className="space-y-6">
                  {firebaseEvents.slice(0, 3).map((event) => {
                    const isExpanded = !!expandedEvents[event.id];
                    return (
                      <li key={event.id} className="flex gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                        {event.image && (
                          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden shrink-0 border border-primary/10 shadow-sm">
                            <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-foreground text-sm sm:text-base truncate">{event.title}</span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {new Date(event.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          {event.description && (
                            <div className="mt-1">
                              <p className={cn(
                                "text-[11px] sm:text-xs text-muted-foreground italic leading-relaxed",
                                !isExpanded && "line-clamp-2"
                              )}>
                                {event.description}
                              </p>
                              {event.description.length > 50 && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => toggleEvent(event.id)}
                                  className="p-0 h-auto mt-1 text-primary font-bold hover:no-underline flex items-center gap-1 text-[10px]"
                                >
                                  {isExpanded ? (
                                    <> {language === 'hi' ? 'कम दिखाएं' : 'Show Less'} <ChevronUp className="h-2 w-2" /> </>
                                  ) : (
                                    <> {language === 'hi' ? 'और पढ़ें' : 'Read More'} <ChevronDown className="h-2 w-2" /> </>
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground italic py-4 text-sm">
                  <AlertCircle className="h-4 w-4" /> {language === 'hi' ? 'अभी कोई लाइव कार्यक्रम निर्धारित नहीं है।' : 'No live events currently scheduled.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 sm:mt-20">
          <h3 className={cn("text-xl sm:text-2xl font-bold text-center mb-8 sm:mb-10", language === 'hi' ? 'font-hindi' : 'font-headline')}>
            {t.eventsAnnual}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 xs:grid-cols-2 lg:grid-cols-4">
            {festivals.map((festival) => {
              const image = PlaceHolderImages.find(
                (img) => img.id === festival.imageId
              );
              return (
                <Card key={festival.name} className="overflow-hidden group shadow-md border-primary/5">
                  <div className="relative aspect-[4/3]">
                    {image && (
                      <Image
                        src={image.imageUrl}
                        alt={language === 'hi' ? `${festival.name} उत्सव` : `${festival.name} festival`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        data-ai-hint={image.imageHint}
                      />
                    )}
                  </div>
                  <div className="p-3 sm:p-4 bg-card">
                    <h4
                      className={cn(
                        "text-center font-semibold text-sm sm:text-base md:text-lg",
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
