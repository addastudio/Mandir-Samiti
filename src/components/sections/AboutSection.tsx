"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, History, Target, Loader2, Sparkles, Quote } from "lucide-react";
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
    <section id="about" className="py-20 sm:py-32 relative overflow-hidden bg-gradient-to-b from-transparent to-secondary/30">
      {/* Decorative background element */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5">
        <div className="absolute top-10 left-10 w-64 h-64 border-8 border-primary rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 border-8 border-accent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="mx-auto max-w-4xl text-center mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="h-3 w-3" /> {language === 'hi' ? 'परंपरा और विरासत' : 'Tradition & Heritage'}
          </div>
          <h2 className={cn("text-4xl sm:text-6xl font-bold text-text-accent", language === "hi" ? "font-hindi" : "font-headline")}>
            {t.aboutTitle}
          </h2>
          <div className="mt-4 h-1.5 w-24 bg-primary mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
          <div className="relative order-2 lg:order-1 group">
            <div className="absolute -inset-4 bg-primary/20 rounded-[2rem] rotate-3 transition-transform group-hover:rotate-6 duration-700" />
            <div className="absolute -inset-4 bg-accent/10 rounded-[2rem] -rotate-3 transition-transform group-hover:-rotate-1 duration-700" />
            <div className="relative overflow-hidden rounded-[1.5rem] shadow-2xl border-4 border-white aspect-[4/3]">
              <Image 
                  src={cmsContent?.featuredImage || galleryImage?.imageUrl || "https://picsum.photos/seed/about-main/800/600"}
                  alt="Temple Heritage"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  data-ai-hint="indian temple architecture"
              />
            </div>
            {/* Floating Detail */}
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl border border-primary/5 hidden sm:flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-1000">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <History className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{language === 'hi' ? 'स्थापित' : 'Established'}</p>
                <p className="text-lg font-bold text-foreground">1970s</p>
              </div>
            </div>
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <div className="relative">
              <Quote className="absolute -top-6 -left-6 h-12 w-12 text-primary/10 -scale-x-100" />
              <div className="bg-white/60 backdrop-blur-sm p-8 sm:p-10 rounded-[2rem] shadow-sm border border-primary/10 transition-all hover:shadow-md">
                  <h3 className={cn("text-2xl sm:text-3xl font-bold flex items-center gap-3 text-text-accent", language === "hi" ? "font-hindi" : "font-headline")}>
                    {t.aboutHistory}
                  </h3>
                  <p className={cn("mt-6 text-muted-foreground text-sm sm:text-lg leading-relaxed italic", language === "hi" ? "font-hindi" : "")}>
                    {historyText}
                  </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary to-accent p-8 sm:p-10 rounded-[2rem] shadow-xl text-white">
                <h3 className={cn("text-2xl sm:text-3xl font-bold flex items-center gap-3", language === "hi" ? "font-hindi" : "font-headline")}>
                  <Target className="h-7 w-7" /> {t.aboutMission}
                </h3>
                <p className={cn("mt-6 text-white/90 text-sm sm:text-lg leading-relaxed font-medium", language === "hi" ? "font-hindi" : "")}>
                  {missionText}
                </p>
            </div>
          </div>
        </div>

        <div className="mt-24 sm:mt-32">
          <div className="text-center mb-12">
            <h3 className={cn("text-3xl sm:text-4xl font-bold text-text-accent", language === 'hi' ? 'font-hindi' : 'font-headline')}>
              {t.aboutMembers}
            </h3>
            <p className="text-muted-foreground mt-2">{language === 'hi' ? 'मंदिर समिति के समर्पित संरक्षक' : 'Dedicated guardians of the temple samiti'}</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {members.map((member, index) => (
                <div key={index} className="group relative bg-white p-8 rounded-3xl border border-primary/5 shadow-sm transition-all hover:-translate-y-2 hover:shadow-xl hover:border-primary/20 text-center">
                  <div className="mx-auto w-20 h-20 bg-secondary rounded-full mb-6 flex items-center justify-center text-primary border-4 border-white shadow-inner group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8" />
                  </div>
                  <h4 className={cn("font-bold text-xl text-foreground", language === "hi" ? "font-hindi" : "")}>{member.name}</h4>
                  <p className={cn("text-[10px] font-black text-primary mt-2 uppercase tracking-[0.2em]", language === "hi" ? "font-hindi" : "")}>{member.role}</p>
                  
                  {/* Decorative dot */}
                  <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
