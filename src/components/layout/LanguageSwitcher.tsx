"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-1 rounded-full border border-primary/50 bg-background p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage("hi")}
        className={cn(
          "rounded-full px-3 py-1 text-sm h-auto",
          language === "hi" && "bg-primary/10 text-primary"
        )}
      >
        हिंदी
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage("en")}
        className={cn(
          "rounded-full px-3 py-1 text-sm h-auto",
          language === "en" && "bg-primary/10 text-primary"
        )}
      >
        English
      </Button>
    </div>
  );
}
