"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageSelectorModal() {
  const { setLanguage, t, showLangPopup, setShowLangPopup } = useLanguage();

  return (
    <Dialog open={showLangPopup} onOpenChange={setShowLangPopup}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle
            className={cn("text-center text-2xl font-hindi")}
          >
            कृपया अपनी भाषा चुनें
          </DialogTitle>
          <DialogDescription className="text-center">
            Please choose your language
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button
            onClick={() => setLanguage("hi")}
            className="h-auto py-4 text-lg font-hindi"
            variant="outline"
          >
            {t.langBtnHi}
          </Button>
          <Button
            onClick={() => setLanguage("en")}
            className="h-auto py-4 text-lg"
            variant="outline"
          >
            {t.langBtnEn}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
