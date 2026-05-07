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

export function AboutSection() {
  const { t, language } = useLanguage();
  const firestore = useFirestore();
  const [cmsContent, setCmsContent] = useState<any>(null);
  const galleryImage = PlaceHolderImages.find((img) => img.id === "gallery-1");

  useEffect(() => {
    // Fetch from the local content folder (Decap CMS outputs)
    fetch('/content/about.json')
      .then(res => res.json())
      .then(data => setCmsContent(data))
      .catch(() => setCmsContent(null));
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
    ? (cmsContent?.history_hi || t.aboutHistoryP1)
    : (cmsContent?.history_en || t.aboutHistoryP1);

  const missionText = language === 'hi' 
    ? (cmsContent?.mission_hi || t.aboutMissionP1)
    : (cmsContent?.mission_en || t.aboutMissionP1);

  return (
    <section id="about" className="py-16 sm:py-20 md:py-28 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className={cn("text-3xl xs:text-4xl font-bold sm:text-5xl text-text-accent flex items-center justify-center gap-2", language === "hi" ? "font-hindi" : "font-headline")}>
            <History className="h-7 w-7 sm:h-9 sm:w-9" />
            {t.aboutTitle}
          </h2>
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-10 lg:grid-cols-2 items-center">
          <div className="space-y-8 order-2 lg:order-1">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-primary/5">
                <h3 className={cn("text-xl sm:text-2xl font-bold flex items-center gap-3 text-primary", language === "hi" ? "font-hindi" : "font-headline")}>
                {t.aboutHistory}
                </h3>
                <div className={cn("mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed whitespace-pre-line", language === "hi" ? "font-hindi" : "")}>
                {historyText}
                </div>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-primary/5">
                <h3 className={cn("text-xl sm:text-2xl font-bold flex items-center gap-3 text-primary", language === "hi" ? "font-hindi" : "font-headline")}>
                {t.aboutMission}
                </h3>
                <div className={cn("mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed whitespace-pre-line", language === "hi" ? "font-hindi" : "")}>
                {missionText}
                </div>
            </div>
          </div>
          <div className="relative order-1 lg:order-2">
            <div className="absolute -inset-4 bg-primary/10 rounded-2xl -rotate-3 hidden sm:block" />
            <div className="relative overflow-hidden rounded-2xl shadow-2xl border-4 border-white">
              <Image 
                  src={cmsContent?.featuredImage || galleryImage?.imageUrl || "https://picsum.photos/seed/about/600/400"}
                  alt="Temple"
                  width={600}
                  height={400}
                  className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mt-16 sm:mt-24">
          <Card className="shadow-xl border-primary/10 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 p-5 sm:p-8 border-b text-center">
              <CardTitle className={cn("flex items-center justify-center gap-2 text-xl sm:text-2xl font-bold", language === "hi" ? "font-hindi" : "font-headline")}>
                <Users className="h-6 w-6 text-primary" /> {t.aboutMembers}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {members.map((member, index) => (
                    <div key={index} className="text-center p-4 rounded-xl border border-primary/5 bg-secondary/10">
                      <p className={cn("font-bold text-lg", language === "hi" ? "font-hindi" : "")}>{member.name}</p>
                      <p className={cn("text-xs text-muted-foreground mt-1 uppercase tracking-widest", language === "hi" ? "font-hindi" : "")}>{member.role}</p>
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
