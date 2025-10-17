"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import TempleIcon from "@/components/icons/TempleIcon";

export function AboutSection() {
  const { t, language } = useLanguage();
  const galleryImage = PlaceHolderImages.find((img) => img.id === "gallery-1");

  const members = [
    { name: t.member1Name, role: t.member1Role },
    { name: t.member2Name, role: t.member2Role },
    { name: t.member3Name, role: t.member3Role },
  ];

  return (
    <section id="about" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-4xl font-bold tracking-tight sm:text-5xl text-text-accent flex items-center justify-center gap-3",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gem"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M12 22V9"/><path d="m3.29 9 8.71 13 8.71-13L12 3z"/></svg>
            {t.aboutTitle}
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center">
          <div className="space-y-8">
            <div>
                <h3
                className={cn(
                    "text-2xl font-semibold",
                    language === "hi" ? "font-hindi" : "font-headline"
                )}
                >
                {t.aboutHistory}
                </h3>
                <p
                className={cn(
                    "mt-4 text-muted-foreground",
                    language === "hi" ? "font-hindi" : ""
                )}
                >
                {t.aboutHistoryP1}
                </p>
            </div>
            <div>
                <h3
                className={cn(
                    "text-2xl font-semibold",
                    language === "hi" ? "font-hindi" : "font-headline"
                )}
                >
                {t.aboutMission}
                </h3>
                <p
                className={cn(
                    "mt-4 text-muted-foreground",
                    language === "hi" ? "font-hindi" : ""
                )}
                >
                {t.aboutMissionP1}
                </p>
            </div>
          </div>
          <div className="flex justify-center">
            {galleryImage && (
                <Image 
                    src={galleryImage.imageUrl}
                    alt={galleryImage.description}
                    width={500}
                    height={350}
                    className="rounded-lg shadow-lg"
                    data-ai-hint={galleryImage.imageHint}
                />
            )}
          </div>
        </div>

        <div className="mt-20">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle
                className={cn(
                  "flex items-center justify-center gap-2 text-2xl",
                  language === "hi" ? "font-hindi" : "font-headline"
                )}
              >
                <Users className="h-6 w-6" /> {t.aboutMembers}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {members.map((member, index) => (
                  <div key={index} className="text-center">
                    <p
                      className={cn(
                        "font-semibold text-lg",
                        language === "hi" ? "font-hindi" : ""
                      )}
                    >
                      {member.name}
                    </p>
                    <p
                      className={cn(
                        "text-sm text-muted-foreground",
                        language === "hi" ? "font-hindi" : ""
                      )}
                    >
                      {member.role}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
