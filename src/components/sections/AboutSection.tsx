
"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, History, Target, Loader2 } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getContentfulSiteContent } from "@/lib/contentful";

export function AboutSection() {
  const { t, language } = useLanguage();
  const firestore = useFirestore();
  const [cmsContent, setCmsContent] = useState<any>(null);
  const galleryImage = PlaceHolderImages.find((img) => img.id === "gallery-1");

  useEffect(() => {
    getContentfulSiteContent().then(setCmsContent);
  }, []);

  const membersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "mandir_samiti_members");
  }, [firestore]);

  const { data: firebaseMembers, isLoading } = useCollection(membersRef);

  const fallbackMembers = [
    { name: t.member1Name, role: t.member1Role },
    { name: t.member2Name, role: t.member2Role },
    { name: t.member3Name, role: t.member3Role },
  ];

  const members = firebaseMembers && firebaseMembers.length > 0 
    ? [...firebaseMembers].sort((a,b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    : fallbackMembers;

  const historyText = language === 'hi' 
    ? (cmsContent?.hiHistory || t.aboutHistoryP1)
    : (cmsContent?.enHistory || t.aboutHistoryP1);

  const missionText = language === 'hi' 
    ? (cmsContent?.hiMission || t.aboutMissionP1)
    : (cmsContent?.enMission || t.aboutMissionP1);

  return (
    <section id="about" className="py-16 sm:py-20 md:py-28 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-3xl xs:text-4xl font-bold tracking-tight sm:text-5xl text-text-accent flex items-center justify-center gap-2 sm:gap-3",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            <History className="h-7 w-7 sm:h-9 sm:w-9" />
            {t.aboutTitle}
          </h2>
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8 sm:space-y-10 order-2 lg:order-1">
            <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-primary/5 hover:border-primary/20 transition-colors">
                <h3
                className={cn(
                    "text-xl sm:text-2xl font-bold flex items-center gap-3 text-primary",
                    language === "hi" ? "font-hindi" : "font-headline"
                )}
                >
                <History className="h-5 w-5 sm:h-6 sm:w-6" />
                {t.aboutHistory}
                </h3>
                <p
                className={cn(
                    "mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed",
                    language === "hi" ? "font-hindi" : ""
                )}
                >
                {historyText}
                </p>
            </div>
            <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-primary/5 hover:border-primary/20 transition-colors">
                <h3
                className={cn(
                    "text-xl sm:text-2xl font-bold flex items-center gap-3 text-primary",
                    language === "hi" ? "font-hindi" : "font-headline"
                )}
                >
                <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                {t.aboutMission}
                </h3>
                <p
                className={cn(
                    "mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed",
                    language === "hi" ? "font-hindi" : ""
                )}
                >
                {missionText}
                </p>
            </div>
          </div>
          <div className="flex justify-center order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-2xl -rotate-3 hidden sm:block" />
              <div className="relative overflow-hidden rounded-2xl shadow-2xl border-4 border-white max-w-full sm:max-w-[500px]">
                {galleryImage && (
                    <Image 
                        src={galleryImage.imageUrl}
                        alt={galleryImage.description}
                        width={500}
                        height={350}
                        sizes="(max-width: 640px) 100vw, 500px"
                        className="object-cover transition-transform duration-700 hover:scale-105"
                        data-ai-hint={galleryImage.imageHint}
                    />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 sm:mt-24">
          <Card className="shadow-xl border-primary/10 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 p-5 sm:p-8 border-b">
              <CardTitle
                className={cn(
                  "flex items-center justify-center gap-2 text-xl sm:text-2xl font-bold",
                  language === "hi" ? "font-hindi" : "font-headline"
                )}
              >
                <Users className="h-6 w-6 sm:h-7 sm:w-7 text-primary" /> {t.aboutMembers}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className={cn(
                  "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0",
                  members.length > 1 && "sm:divide-x divide-border/40"
                )}>
                  {members.map((member, index) => (
                    <div key={index} className="text-center pt-6 sm:pt-0 sm:px-4">
                      <p
                        className={cn(
                          "font-bold text-lg sm:text-xl",
                          language === "hi" ? "font-hindi" : ""
                        )}
                      >
                        {member.name}
                      </p>
                      <p
                        className={cn(
                          "text-xs sm:text-sm text-muted-foreground mt-1 uppercase tracking-widest font-medium opacity-80",
                          language === "hi" ? "font-hindi" : ""
                        )}
                      >
                        {member.role}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
