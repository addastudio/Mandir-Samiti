"use client";

import * as React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, Banknote, Heart, ShieldCheck, CheckCircle2, IndianRupee, Loader2, QrCode, Globe, AlertTriangle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";
import { createStripeCheckoutSession, createCashfreeOrder, getPaymentGatewayStatus } from "@/app/actions";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Suspense } from "react";

function DonateContent() {
  const { language, t } = useLanguage();
  const { user } = useUser();
  const { toast } = useToast();
  const [amount, setAmount] = React.useState<string>("501");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [gateways, setGateways] = React.useState<{ stripe: boolean; cashfree: boolean } | null>(null);

  React.useEffect(() => {
    getPaymentGatewayStatus().then(setGateways);
  }, []);

  const handleStripeDonate = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    setIsProcessing(true);
    try {
      const result = await createStripeCheckoutSession(Number(amount), user?.email || undefined);
      if (result.success && result.url) window.location.href = result.url;
      else setIsProcessing(false);
    } catch (err) { setIsProcessing(false); }
  };

  const handleCashfreeDonate = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    setIsProcessing(true);
    try {
      const result = await createCashfreeOrder(Number(amount), user?.email || undefined, user?.uid || undefined);
      if (result.success && result.paymentSessionId) {
        const cashfree = new (window as any).Cashfree({ mode: "sandbox" });
        cashfree.checkout({ paymentSessionId: result.paymentSessionId });
      }
    } finally { setIsProcessing(false); }
  };

  return (
    <div className={cn("bg-background min-h-screen flex flex-col", language === "hi" && "font-hindi")}>
      <Header />
      <main id="main-content" className="flex-grow pt-24 pb-12 sm:pt-32 relative">
        {/* User Muting Overlay */}
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <Card className="max-w-md shadow-2xl border-primary/20 p-10">
            <AlertTriangle className="h-16 w-16 text-amber-600 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">{language === 'hi' ? 'सेवा अस्थायी रूप से अनुपलब्ध' : 'Service Temporarily Unavailable'}</h1>
            <p className="text-muted-foreground mb-8">
              {language === 'hi' 
                ? 'ऑनलाइन दान सेवा वर्तमान में रखरखाव के लिए बंद है। कृपया बाद में प्रयास करें।' 
                : 'The online donation service is currently offline for maintenance. Please check back later.'}
            </p>
            <Link href="/"><Button className="w-full h-12 font-bold">{t.backToHome}</Button></Link>
          </Card>
        </div>

        <div className="container mx-auto px-4 opacity-10 pointer-events-none grayscale">
          <Breadcrumbs items={[{ label: t.navDonate }]} />
          {/* Muted Page Content Remains in file */}
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
                <Heart className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h1 className={cn("text-3xl sm:text-5xl font-bold text-text-accent", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                {t.donateTitle}
              </h1>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import Link from "next/link";

export default function DonatePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <DonateContent />
    </Suspense>
  );
}
