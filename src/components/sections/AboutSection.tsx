"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export function AboutSection() {
  const { t, language } = useLanguage();

  const members = [
    { name: t.member1Name, role: t.member1Role },
    { name: t.member2Name, role: t.member2Role },
    { name: t.member3Name, role: t.member3Role },
  ];

  return (
    <section id="about" className="bg-secondary py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-3xl font-bold tracking-tight sm:text-4xl",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            {t.aboutTitle}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2">
          <div className="space-y-6">
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
                "text-muted-foreground",
                language === "hi" ? "font-hindi" : ""
              )}
            >
              {t.aboutHistoryP1}
            </p>
          </div>
          <div className="space-y-6">
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
                "text-muted-foreground",
                language === "hi" ? "font-hindi" : ""
              )}
            >
              {t.aboutMissionP1}
            </p>
          </div>
        </div>

        <div className="mt-16">
          <Card>
            <CardHeader>
              <CardTitle
                className={cn(
                  "flex items-center gap-2 text-2xl",
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
                        "font-semibold",
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
