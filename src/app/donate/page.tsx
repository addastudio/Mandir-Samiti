"use client";

import * as React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, Banknote, Heart, ShieldCheck, CheckCircle2, IndianRupee, Loader2, QrCode, Globe } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";
import { createStripeCheckoutSession, createCashfreeOrder, getPaymentGatewayStatus } from "@/app/actions";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Suspense } from "react";

declare global {
  interface Window {
    Cashfree: any;
  }
}

function DonateContent() {
  const { language, t } = useLanguage();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [amount, setAmount] = React.useState<string>("501");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [gateways, setGateways] = React.useState<{ stripe: boolean; cashfree: boolean } | null>(null);

  React.useEffect(() => {
    getPaymentGatewayStatus().then(setGateways);
  }, []);

  React.useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      toast({
        variant: "destructive",
        title: language === 'hi' ? "भुगतान रद्द" : "Payment Canceled",
        description: language === 'hi' ? "दान प्रक्रिया रद्द कर दी गई थी।" : "The donation process was canceled.",
      });
    }
  }, [searchParams, toast, language]);

  const handleStripeDonate = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ 
        variant: "destructive", 
        title: language === 'hi' ? "अमान्य राशि" : "Invalid Amount", 
        description: language === 'hi' ? "कृपया दान के लिए एक वैध राशि दर्ज करें।" : "Please enter a valid donation amount." 
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createStripeCheckoutSession(Number(amount), user?.email || undefined);
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
        setIsProcessing(false);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Payment gateway error." });
      setIsProcessing(false);
    }
  };

  const handleCashfreeDonate = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount" });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createCashfreeOrder(Number(amount), user?.email || undefined, user?.uid || undefined);
      if (result.success && result.paymentSessionId) {
        const cashfree = new window.Cashfree({
          mode: process.env.NEXT_PUBLIC_CASHFREE_MODE || "sandbox",
        });
        cashfree.checkout({
          paymentSessionId: result.paymentSessionId,
        });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Cashfree initialization failed." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={cn("bg-background min-h-screen flex flex-col", language === "hi" && "font-hindi")}>
      <Header />
      <main id="main-content" className="flex-grow pt-24 pb-12 sm:pt-32">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: t.navDonate }]} />

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
                      {!gateways ? (
                        <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {gateways.cashfree && (
                            <Button 
                              size="lg" 
                              className="w-full h-14 text-lg font-bold shadow-md bg-green-600 hover:bg-green-700 text-white gap-2 transition-all"
                              onClick={handleCashfreeDonate}
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <QrCode className="h-5 w-5" />}
                              {language === 'hi' ? 'UPI / QR / नेटबैंकिंग' : 'UPI / QR / Netbanking'}
                            </Button>
                          )}
                          {gateways.stripe && (
                            <Button 
                              variant="outline"
                              size="lg" 
                              className="w-full h-14 text-lg font-bold shadow-sm gap-2 border-primary/20 hover:bg-primary/5"
                              onClick={handleStripeDonate}
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Globe className="h-5 w-5" />}
                              {language === 'hi' ? 'ऑनलाइन कार्ड (Stripe)' : 'Online Card (Stripe)'}
                            </Button>
                          )}
                          {!gateways.stripe && !gateways.cashfree && (
                            <p className="text-center text-destructive text-sm italic py-2">{language === 'hi' ? 'ऑनलाइन भुगतान वर्तमान में अक्षम है।' : 'Online payments are currently disabled.'}</p>
                          )}
                        </div>
                      )}
                      
                      <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {language === 'hi' ? 'सुरक्षित भुगतान गेटवे' : 'Secured and Encrypted Payment Gateway'}
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

              <div className="lg:col-span-5 space-y-6">
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

export default function DonatePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <DonateContent />
    </Suspense>
  );
}
