
"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function NoticeSection() {
  const { t, language } = useLanguage();
  const firestore = useFirestore();

  const noticesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "notices");
  }, [firestore]);

  const { data: notices, isLoading } = useCollection(noticesRef);

  if (!isLoading && (!notices || notices.length === 0)) return null;

  return (
    <section id="notices" className="py-12 bg-amber-50/50 border-y border-amber-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Bell className="h-6 w-6 text-primary" />
          <h2 className={cn("text-3xl font-bold text-text-accent", language === 'hi' ? 'font-hindi' : 'font-headline')}>
            {t.noticesTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse h-32 bg-muted/50" />
            ))
          ) : (
            notices?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6).map((notice) => (
              <Card key={notice.id} className={cn("border-l-4 transition-all hover:shadow-md", notice.importance === 'urgent' ? "border-l-destructive" : "border-l-primary")}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg leading-tight line-clamp-1">{notice.title}</CardTitle>
                    {notice.importance === 'urgent' ? (
                      <Badge variant="destructive" className="shrink-0">{t.noticesUrgent}</Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0">{t.noticesNormal}</Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-3">{notice.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
