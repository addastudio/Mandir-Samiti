
"use client";

import * as React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Banknote, QrCode, Heart, Copy, ShieldCheck, CheckCircle2, IndianRupee, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { createStripeCheckoutSession } from "@/app/actions";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function DonatePage() {
  const { language, t } = useLanguage();
  const { user } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();
  const [amount, setAmount] = React.useState<string>("501");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const qrImage = PlaceHolderImages.find((img) => img.id === "donation-qr");

  const handleStripeDonate = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid donation amount." });
      return;
    }

    setIsProcessing(true);
    const result = await createStripeCheckoutSession(Number(amount), user?.email || undefined);
    
    if (result.success && result.url) {
      // In a real integration, you would redirect to result.url
      // window.location.href = result.url;
      toast({ 
        title: "Stripe Redirect", 
        description: "In production, you would now be redirected to Stripe Checkout. [Sandbox Simulation]" 
      });
      
      // Simulate success for the dashboard record
      if (user && firestore) {
        const donationsRef = collection(firestore, "users", user.uid, "donations");
        addDocumentNonBlocking(donationsRef, {
          userId: user.uid,
          amount: Number(amount),
          date: new Date().toISOString(),
          mode: "Stripe Online",
          status: "completed"
        });
      }
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsProcessing(false);
  };

  const copyUpi = () => {
    navigator.clipboard.writeText(t.donateUpiId);
    toast({ title: language === 'hi' ? "कॉपी किया गया" : "Copied", description: t.donateUpiId });
  };

  return (
    <div className={cn("bg-background min-h-screen flex flex-col", language === "hi" && "font-hindi")}>
      <Header />
      <main className="flex-grow pt-24 pb-12 sm:pt-32">
        <div className="container mx-auto px-4">
          <div className="flex items-center mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/")}
              className="gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.backToHome}
            </Button>
          </div>

          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
                <Heart className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h1 className={cn("text-3xl sm:text-5xl font-bold text-text-accent", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                {t.donateTitle}
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-lg">
                {t.donateDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Online Payment Column */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="shadow-xl border-primary/10 overflow-hidden">
                  <CardHeader className="bg-primary/5 p-6 border-b border-primary/5">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-xl">{t.donateOnlineTitle}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">{t.donateOnlineDesc}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-10 space-y-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">{language === 'hi' ? 'राशि चुनें' : 'Choose Amount'}</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {["101", "501", "1100", "2100", "5100", "11000"].map((val) => (
                          <Button 
                            key={val} 
                            variant={amount === val ? "default" : "outline"}
                            className={cn("h-12 text-sm sm:text-base font-bold transition-all", amount === val && "ring-4 ring-primary/20 scale-105")}
                            onClick={() => setAmount(val)}
                          >
                            ₹{val}
                          </Button>
                        ))}
                        <div className="col-span-full mt-2">
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="number" 
                              placeholder={t.donateAmountPlaceholder} 
                              className="pl-10 h-12 text-lg font-bold"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <Button 
                        size="lg" 
                        className="w-full h-14 text-lg font-bold shadow-xl gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        onClick={handleStripeDonate}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                        {t.donateOnlineBtn}
                      </Button>
                      <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {language === 'hi' ? 'Stripe द्वारा सुरक्षित और एन्क्रिप्टेड' : 'Secured and Encrypted by Stripe'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-4">
                  <div className="bg-white p-2 rounded-full h-fit shadow-sm"><ShieldCheck className="h-5 w-5 text-amber-600" /></div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-amber-900">{language === 'hi' ? 'पारदर्शिता की गारंटी' : 'Transparency Guaranteed'}</h4>
                    <p className="text-xs text-amber-800 opacity-80 leading-relaxed">
                      {language === 'hi' 
                        ? 'आपका प्रत्येक योगदान मंदिर की उन्नति और सामुदायिक सेवा परियोजनाओं में सीधे उपयोग किया जाता है।' 
                        : 'Every rupee contributed is used directly for temple maintenance and community service projects.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Offline Payment Column */}
              <div className="lg:col-span-5 space-y-6">
                <Card className="shadow-lg border-primary/10">
                  <CardHeader className="bg-secondary/30 p-5">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-primary" /> {t.donateUpi}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center gap-6">
                    {qrImage && (
                      <div className="relative h-48 w-48 p-2 bg-white rounded-xl shadow-inner ring-1 ring-primary/10">
                        <Image
                          src={qrImage.imageUrl}
                          alt="Donation QR"
                          fill
                          className="rounded-lg object-cover p-2"
                        />
                      </div>
                    )}
                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-primary/10">
                        <span className="font-bold text-primary">{t.donateUpiId}</span>
                        <Button variant="ghost" size="icon" onClick={copyUpi} className="h-8 w-8 hover:bg-primary/20"><Copy className="h-4 w-4" /></Button>
                      </div>
                      <p className="text-[10px] text-center text-muted-foreground">{language === 'hi' ? 'किसी भी UPI ऐप से स्कैन करें' : 'Scan via any UPI App'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-primary/10">
                  <CardHeader className="bg-secondary/30 p-5">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-primary" /> {t.donateBankInfo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 text-sm">
                    <div className="flex flex-col gap-1 border-b pb-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">{t.donateAccountName.split(':')[0]}</span>
                      <span className="font-medium text-foreground">{t.donateAccountName.split(':')[1]}</span>
                    </div>
                    <div className="flex flex-col gap-1 border-b pb-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">{t.donateAccountNumber.split(':')[0]}</span>
                      <span className="font-medium text-foreground">{t.donateAccountNumber.split(':')[1]}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">{t.donateIFSC.split(':')[0]}</span>
                      <span className="font-medium text-foreground">{t.donateIFSC.split(':')[1]}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
