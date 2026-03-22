"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banknote, QrCode, Heart, Copy, Loader2 } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { useState } from "react";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export function DonateSection() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isProcessing, setIsProcessing] = useState(false);

  const qrImage = PlaceHolderImages.find((img) => img.id === "donation-qr");
  const upiId = t.donateUpiId;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(upiId);
    toast({
      title: language === 'hi' ? "कॉपी किया गया" : "Copied to clipboard",
      description: `UPI ID: ${upiId}`,
    });
  };

  const handleDonateRecord = async () => {
    if (!user) {
      toast({
        title: language === 'hi' ? "लॉगिन आवश्यक है" : "Login Required",
        description: language === 'hi' ? "दान का रिकॉर्ड रखने के लिए कृपया लॉगिन करें।" : "Please login to keep a record of your donation.",
        variant: "destructive",
      });
      return;
    }

    if (!firestore) return;

    setIsProcessing(true);
    
    const donationsRef = collection(firestore, "users", user.uid, "donations");
    const donationData = {
      userId: user.uid,
      amount: 501, 
      date: new Date().toISOString(),
      mode: "UPI (Scanned QR)",
    };

    addDocumentNonBlocking(donationsRef, donationData);

    setTimeout(() => {
      toast({
        title: language === 'hi' ? "रिकॉर्ड सहेजा गया" : "Record Saved",
        description: language === 'hi' ? "आपके दान का विवरण आपके डैशबोर्ड में जोड़ दिया गया है।" : "Your donation details have been added to your dashboard.",
      });
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <section id="donate" className="py-16 sm:py-20 md:py-28 bg-gradient-to-br from-yellow-50/50 via-amber-100/30 to-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-3xl xs:text-4xl font-bold tracking-tight sm:text-5xl text-text-accent flex items-center justify-center gap-2 sm:gap-3",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            <Heart className="h-7 w-7 sm:h-8 sm:w-8" />
            {t.donateTitle}
          </h2>
          <p
            className={cn(
              "mt-4 text-base sm:text-lg text-muted-foreground",
              language === "hi" ? "font-hindi" : ""
            )}
          >
            {t.donateDescription}
          </p>
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
          <Card className="shadow-lg border-primary/10 lg:col-span-1">
            <CardHeader className="p-5 sm:p-6 border-b border-primary/5">
              <CardTitle
                className={cn(
                  "flex items-center gap-2 text-xl sm:text-2xl",
                  language === "hi" ? "font-hindi" : ""
                )}
              >
                <Banknote className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> {t.donateBankInfo}
              </CardTitle>
            </CardHeader>
            <CardContent
              className={cn("p-5 sm:p-6 space-y-4 text-sm sm:text-base text-muted-foreground", language === "hi" ? "font-hindi" : "")}
            >
              <div className="flex flex-col gap-1">
                <strong className="text-foreground text-xs uppercase tracking-wider opacity-60 font-bold">{t.donateAccountName.split(':')[0]}</strong>
                <span className="font-medium text-foreground">{t.donateAccountName.split(':')[1]}</span>
              </div>
              <div className="flex flex-col gap-1">
                <strong className="text-foreground text-xs uppercase tracking-wider opacity-60 font-bold">{t.donateAccountNumber.split(':')[0]}</strong>
                <span className="font-medium text-foreground">{t.donateAccountNumber.split(':')[1]}</span>
              </div>
              <div className="flex flex-col gap-1">
                <strong className="text-foreground text-xs uppercase tracking-wider opacity-60 font-bold">{t.donateBankName.split(':')[0]}</strong>
                <span className="font-medium text-foreground">{t.donateBankName.split(':')[1]}</span>
              </div>
              <div className="flex flex-col gap-1">
                <strong className="text-foreground text-xs uppercase tracking-wider opacity-60 font-bold">{t.donateIFSC.split(':')[0]}</strong>
                <span className="font-medium text-foreground">{t.donateIFSC.split(':')[1]}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-primary/10 lg:col-span-2 overflow-hidden">
            <CardHeader className="p-5 sm:p-6 border-b border-primary/5">
              <CardTitle
                className={cn(
                  "flex items-center gap-2 text-xl sm:text-2xl",
                  language === "hi" ? "font-hindi" : ""
                )}
              >
                <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> {t.donateUpi}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center gap-8">
              <div className="flex w-full flex-col items-center justify-center gap-8 sm:flex-row sm:gap-10">
                {qrImage && (
                  <div className="relative h-[160px] w-[160px] sm:h-[200px] sm:w-[200px] p-2 bg-white rounded-xl shadow-inner ring-1 ring-primary/10">
                    <Image
                      src={qrImage.imageUrl}
                      alt={qrImage.description}
                      fill
                      sizes="(max-width: 640px) 160px, 200px"
                      className="rounded-lg object-cover p-2"
                      data-ai-hint={qrImage.imageHint}
                    />
                  </div>
                )}
                <div className={cn("flex flex-col items-center gap-4 text-center sm:items-start sm:text-left", language === "hi" ? "font-hindi" : "")}>
                  <p className="text-muted-foreground font-medium">{language === 'hi' ? 'स्कैन करें और भुगतान करें' : 'Scan & Pay via any UPI App'}</p>
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 border border-primary/10 shadow-sm">
                    <p className="font-bold text-lg sm:text-xl text-primary">{upiId}</p>
                    <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-8 w-8 hover:bg-primary/10 text-primary" aria-label={language === 'hi' ? "UPI ID कॉपी करें" : "Copy UPI ID"}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-md pt-4">
                <Button
                  size="lg"
                  onClick={handleDonateRecord}
                  disabled={isProcessing}
                  className={cn(
                    "w-full bg-accent text-accent-foreground shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] font-bold h-12 sm:h-14 rounded-xl",
                    language === "hi" ? "font-hindi text-lg" : ""
                  )}
                >
                  {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  {t.donateBtn}
                </Button>
                <p
                  className={cn(
                    "mt-6 text-[10px] sm:text-xs text-muted-foreground text-center",
                    language === "hi" ? "font-hindi" : ""
                  )}
                >
                  {t.donateTransparency}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
