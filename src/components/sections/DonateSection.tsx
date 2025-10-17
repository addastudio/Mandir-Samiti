"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banknote, QrCode } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function DonateSection() {
  const { t, language } = useLanguage();
  const qrImage = PlaceHolderImages.find((img) => img.id === "donation-qr");

  return (
    <section id="donate" className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-3xl font-bold tracking-tight sm:text-4xl",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            {t.donateTitle}
          </h2>
          <p
            className={cn(
              "mt-4 text-lg text-muted-foreground",
              language === "hi" ? "font-hindi" : ""
            )}
          >
            {t.donateDescription}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle
                className={cn(
                  "flex items-center gap-2",
                  language === "hi" ? "font-hindi" : ""
                )}
              >
                <Banknote className="h-6 w-6 text-primary" /> {t.donateBankInfo}
              </CardTitle>
            </CardHeader>
            <CardContent
              className={cn("space-y-2", language === "hi" ? "font-hindi" : "")}
            >
              <p>{t.donateAccountName}</p>
              <p>{t.donateAccountNumber}</p>
              <p>{t.donateBankName}</p>
              <p>{t.donateIFSC}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle
                className={cn(
                  "flex items-center gap-2",
                  language === "hi" ? "font-hindi" : ""
                )}
              >
                <QrCode className="h-6 w-6 text-primary" /> {t.donateUpi}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 sm:flex-row">
              {qrImage && (
                <Image
                  src={qrImage.imageUrl}
                  alt={qrImage.description}
                  width={150}
                  height={150}
                  className="rounded-lg"
                  data-ai-hint={qrImage.imageHint}
                />
              )}
              <div className={cn(language === "hi" ? "font-hindi" : "")}>
                <p className="font-semibold">{t.donateUpiId}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Button
            size="lg"
            className={cn(
              "bg-accent text-accent-foreground hover:bg-accent/90",
              language === "hi" ? "font-hindi" : ""
            )}
          >
            {t.donateBtn}
          </Button>
          <p
            className={cn(
              "mt-4 text-sm text-muted-foreground",
              language === "hi" ? "font-hindi" : ""
            )}
          >
            {t.donateTransparency}
          </p>
        </div>
      </div>
    </section>
  );
}
