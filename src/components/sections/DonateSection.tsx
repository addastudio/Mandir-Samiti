
"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function DonateSection() {
  const { t, language } = useLanguage();

  return (
    <section id="donate" className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-2xl border-primary/10 overflow-hidden bg-gradient-to-br from-white to-amber-50/30">
            <CardContent className="p-8 sm:p-12 md:p-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-wider">
                    <Heart className="h-3 w-3 fill-current" /> {language === 'hi' ? 'सहयोग' : 'Support Us'}
                  </div>
                  <h2
                    className={cn(
                      "text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-text-accent leading-tight",
                      language === "hi" ? "font-hindi" : "font-headline"
                    )}
                  >
                    {t.donateTitle}
                  </h2>
                  <p
                    className={cn(
                      "text-base sm:text-lg text-muted-foreground leading-relaxed",
                      language === "hi" ? "font-hindi" : ""
                    )}
                  >
                    {t.donateDescription}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                    <Link href="/donate" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        className={cn(
                          "w-full bg-accent text-accent-foreground shadow-xl shadow-accent/20 transition-all hover:scale-[1.05] active:scale-[0.95] font-bold h-14 rounded-xl gap-2",
                          language === "hi" ? "font-hindi text-lg" : ""
                        )}
                      >
                        {t.donateBtn}
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>

                  <div className="flex items-center justify-center md:justify-start gap-6 pt-6 border-t border-primary/10">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest">{language === 'hi' ? 'सुरक्षित भुगतान' : 'Secure Payment'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest">{language === 'hi' ? '८०जी लाभ' : 'Tax Benefits'}</span>
                    </div>
                  </div>
                </div>

                <div className="relative aspect-square hidden md:block">
                  <div className="absolute inset-0 bg-primary/10 rounded-3xl rotate-6 -z-10" />
                  <div className="absolute inset-0 bg-accent/10 rounded-3xl -rotate-3 -z-10" />
                  <div className="w-full h-full rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                    <img 
                      src="https://picsum.photos/seed/donate-hero/600/600" 
                      alt="Donation Impact" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Floating Stat Card */}
                  <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-2xl border border-primary/5 flex items-center gap-3 animate-in slide-in-from-left duration-1000">
                    <div className="bg-green-100 p-2 rounded-full"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Community Impact</p>
                      <p className="text-sm font-bold text-foreground">100% Transparency</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
