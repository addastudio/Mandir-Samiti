"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banknote, QrCode, Heart, Copy, Loader2 } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
    
    // Simulate a donation record being created
    const donationsRef = collection(firestore, "users", user.uid, "donations");
    const donationData = {
      userId: user.uid,
      amount: 501, // Example fixed amount for "record"
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
    <section id="donate" className="py-20 md:py-28 bg-gradient-to-br from-yellow-50/50 via-amber-100/30 to-background">
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

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card className="shadow-lg lg:col-span-1">
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

          <Card className="shadow-lg lg:col-span-2">
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
            <CardContent className="flex flex-col items-center justify-center gap-8">
              <div className="flex w-full flex-col items-center justify-center gap-6 sm:flex-row sm:gap-8">
                {qrImage && (
                  <div className="relative h-[180px] w-[180px]">
                    <Image
                      src={qrImage.imageUrl}
                      alt={qrImage.description}
                      fill
                      className="rounded-lg shadow-md flex-shrink-0 object-cover"
                      data-ai-hint={qrImage.imageHint}
                    />
                  </div>
                )}
                <div className={cn("flex flex-col items-center gap-3 text-center sm:items-start sm:text-left", language === "hi" ? "font-hindi" : "")}>
                  <p className="text-muted-foreground">{language === 'hi' ? 'स्कैन करें और भुगतान करें' : 'Scan & Pay'}</p>
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-secondary p-2">
                    <p className="font-semibold text-lg text-primary">{upiId}</p>
                    <Button variant="ghost" size="icon" onClick={copyToClipboard} aria-label={language === 'hi' ? "UPI ID कॉपी करें" : "Copy UPI ID"}>
                      <Copy className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                onClick={handleDonateRecord}
                disabled={isProcessing}
                className={cn(
                  "w-full max-w-xs bg-gradient-to-r from-accent to-primary text-white shadow-lg transition-transform hover:scale-105",
                  language === "hi" ? "font-hindi" : ""
                )}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
