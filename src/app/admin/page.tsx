"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, ShieldCheck, ArrowRight, LayoutDashboard, Database } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

/**
 * Gateway page for Administrators.
 * Provides clear navigation between the Content CMS (Netlify) and the Operations Panel (Firebase).
 */
export default function AdminGatewayPage() {
  const { language, t } = useLanguage();

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-xl border-primary/10 overflow-hidden hover:shadow-2xl transition-all group">
          <CardHeader className="bg-primary/5 pb-8">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className={cn("text-2xl", language === 'hi' ? 'font-hindi' : 'font-headline')}>
              {language === 'hi' ? 'कंटेंट एडिटर' : 'Content Editor'}
            </CardTitle>
            <CardDescription>
              {language === 'hi' 
                ? 'वेबसाइट के मुख्य कंटेंट, हीरो सेक्शन और अबाउट अस को बदलें।' 
                : 'Manage structural content like Hero, About Us, and Seva programs.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Link href="/admin/index.html">
              <Button className="w-full h-12 gap-2 font-bold shadow-md">
                {language === 'hi' ? 'CMS खोलें' : 'Open CMS'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="mt-4 text-[10px] text-muted-foreground text-center uppercase tracking-widest font-bold opacity-60">
              Powered by Decap CMS
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-primary/10 overflow-hidden hover:shadow-2xl transition-all group">
          <CardHeader className="bg-accent/5 pb-8">
            <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Database className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className={cn("text-2xl", language === 'hi' ? 'font-hindi' : 'font-headline')}>
              {language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel'}
            </CardTitle>
            <CardDescription>
              {language === 'hi' 
                ? 'दान, इवेंट्स, सूचना और भक्तों के रिकॉर्ड प्रबंधित करें।' 
                : 'Handle daily operations: Donations, Notices, Events, and Members.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Link href="/management">
              <Button variant="secondary" className="w-full h-12 gap-2 font-bold shadow-md">
                {language === 'hi' ? 'पैनल खोलें' : 'Open Management'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="mt-4 text-[10px] text-muted-foreground text-center uppercase tracking-widest font-bold opacity-60">
              Powered by Firebase
            </p>
          </CardContent>
        </Card>

        <div className="md:col-span-2 text-center pt-4">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary">
              <ArrowRight className="h-4 w-4 rotate-180" />
              {t.backToHome}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}