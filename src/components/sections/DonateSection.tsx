"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banknote, QrCode, Heart, Copy } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useToast } from "@/hooks/use-toast";

export function DonateSection() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const qrImage = PlaceHolderImages.find((img) => img.id === "donation-qr");
  const upiId = t.donateUpiId;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(upiId);
    toast({
      title: language === 'hi' ? "कॉपी किया गया" : "Copied to clipboard",
      description: language === 'hi' ? `UPI ID: ${upiId}`: `UPI ID: ${upiId}`,
    });
  };


  return (
    <section id="donate" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-4xl font-bold tracking-tight sm:text-5xl text-text-accent flex items-center justify-center gap-3",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            <Heart className="h-8 w-8" />
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

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-1 shadow-lg">
            <CardHeader>
              <CardTitle
                className={cn(
                  "flex items-center gap-2 text-2xl",
                  language === "hi" ? "font-hindi" : ""
                )}
              >
                <Banknote className="h-6 w-6 text-primary" /> {t.donateBankInfo}
              </CardTitle>
            </CardHeader>
            <CardContent
              className={cn("space-y-3 text-muted-foreground", language === "hi" ? "font-hindi" : "")}
            >
              <p><strong className="text-foreground">{t.donateAccountName.split(':')[0]}:</strong> {t.donateAccountName.split(':')[1]}</p>
              <p><strong className="text-foreground">{t.donateAccountNumber.split(':')[0]}:</strong> {t.donateAccountNumber.split(':')[1]}</p>
              <p><strong className="text-foreground">{t.donateBankName.split(':')[0]}:</strong> {t.donateBankName.split(':')[1]}</p>
              <p><strong className="text-foreground">{t.donateIFSC.split(':')[0]}:</strong> {t.donateIFSC.split(':')[1]}</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle
                className={cn(
                  "flex items-center gap-2 text-2xl",
                  language === "hi" ? "font-hindi" : ""
                )}
              >
                <QrCode className="h-6 w-6 text-primary" /> {t.donateUpi}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-center w-full">
                    {qrImage && (
                        <Image
                        src={qrImage.imageUrl}
                        alt={qrImage.description}
                        width={180}
                        height={180}
                        className="rounded-lg shadow-md flex-shrink-0"
                        data-ai-hint={qrImage.imageHint}
                        />
                    )}
                    <div className={cn("flex flex-col items-center sm:items-start gap-2", language === "hi" ? "font-hindi" : "")}>
                        <p className="text-muted-foreground">{language === 'hi' ? 'स्कैन करें और भुगतान करें' : 'Scan & Pay'}</p>
                        <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-secondary">
                          <p className="font-semibold text-lg text-primary">{upiId}</p>
                          <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                              <Copy className="h-5 w-5" />
                          </Button>
                        </div>
                    </div>
                </div>
                 <Button
                    size="lg"
                    className={cn(
                    "mt-4 w-full max-w-xs bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg transition-transform hover:scale-105",
                    language === "hi" ? "font-hindi" : ""
                    )}
                >
                    {t.donateBtn}
                </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
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
