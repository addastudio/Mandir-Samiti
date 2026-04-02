"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function NoticeSection() {
  const { t, language } = useLanguage();
  const firestore = useFirestore();
  const [expandedNotices, setExpandedNotices] = useState<Record<string, boolean>>({});

  const noticesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "notices");
  }, [firestore]);

  const { data: notices, isLoading } = useCollection(noticesRef);

  const toggleNotice = (id: string) => {
    setExpandedNotices((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!isLoading && (!notices || notices.length === 0)) return null;

  return (
    <section id="notices" className="py-10 sm:py-16 bg-amber-50/50 border-y border-amber-100/50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-8 sm:mb-12 justify-center">
          <Bell className="h-6 w-6 sm:h-7 sm:w-7 text-primary animate-ring" />
          <h2 className={cn("text-2xl sm:text-3xl font-bold text-text-accent", language === 'hi' ? 'font-hindi' : 'font-headline')}>
            {t.noticesTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse h-32 sm:h-40 bg-muted/50 rounded-xl" />
            ))
          ) : (
            notices?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6).map((notice) => {
              const isExpanded = !!expandedNotices[notice.id];
              return (
                <Card key={notice.id} className={cn("border-l-4 transition-all hover:shadow-lg rounded-xl flex flex-col h-full", notice.importance === 'urgent' ? "border-l-destructive shadow-sm" : "border-l-primary shadow-sm")}>
                  <CardHeader className="p-4 sm:p-5 pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base sm:text-lg leading-tight line-clamp-1 font-bold">{notice.title}</CardTitle>
                      {notice.importance === 'urgent' ? (
                        <Badge variant="destructive" className="shrink-0 text-[9px] sm:text-xs uppercase font-bold tracking-wider">{t.noticesUrgent}</Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 text-[9px] sm:text-xs uppercase font-bold tracking-wider">{t.noticesNormal}</Badge>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground opacity-70 mt-1">
                      {new Date(notice.createdAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 pt-0 flex-grow">
                    <p className={cn(
                      "text-sm text-muted-foreground leading-relaxed",
                      !isExpanded && "line-clamp-3"
                    )}>
                      {notice.content}
                    </p>
                    {notice.content.length > 120 && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => toggleNotice(notice.id)}
                        className="p-0 h-auto mt-2 text-primary font-bold hover:no-underline flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <> {language === 'hi' ? 'कम दिखाएं' : 'Show Less'} <ChevronUp className="h-3 w-3" /> </>
                        ) : (
                          <> {language === 'hi' ? 'और पढ़ें' : 'Read More'} <ChevronDown className="h-3 w-3" /> </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
