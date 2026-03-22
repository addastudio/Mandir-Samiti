"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PrayerIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 2v20"/><path d="m17 7-5 5-5-5"/><path d="m17 17-5-5-5 5"/>
  </svg>
);

export function PrayerRequestSection() {
  const { t, language } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const requestData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      requestType: formData.get("requestType") as string,
      message: formData.get("message") as string,
      status: "pending",
      createdAt: new Date().toISOString(),
      userId: user?.uid || null,
    };

    const requestsRef = collection(firestore, "prayer_requests");
    
    try {
      addDocumentNonBlocking(requestsRef, requestData);
      toast({
        title: language === 'hi' ? "सफलता" : "Success",
        description: t.prayerFormSuccess,
      });
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: language === 'hi' ? "त्रुटि" : "Error",
        description: t.prayerFormError,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="prayer" className="py-16 sm:py-20 md:py-28 bg-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-3xl xs:text-4xl font-bold tracking-tight sm:text-5xl text-text-accent flex items-center justify-center gap-2 sm:gap-3",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            <PrayerIcon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            {t.prayerTitle}
          </h2>
          <p className={cn("mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto", language === 'hi' ? 'font-hindi' : '')}>
            {t.prayerSubtitle}
          </p>
        </div>

        <div className="mt-12 sm:mt-16 max-w-2xl mx-auto">
          <Card className="shadow-2xl border-primary/10 rounded-2xl overflow-hidden">
            <CardHeader className="bg-primary/5 p-5 sm:p-8">
              <CardTitle className={cn("text-xl sm:text-2xl font-bold", language === 'hi' ? 'font-hindi' : '')}>{language === 'hi' ? 'निवेदन फॉर्म' : 'Request Form'}</CardTitle>
              <CardDescription className={cn("text-sm sm:text-base mt-1", language === 'hi' ? 'font-hindi' : '')}>
                {language === 'hi' ? 'कृपया अपनी जानकारी और निवेदन विस्तार से भरें।' : 'Please fill in your details and request clearly.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-8 pt-8 sm:pt-10">
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="prayer-name" className="text-xs sm:text-sm font-bold opacity-70">{t.contactFormName}</Label>
                    <Input id="prayer-name" name="name" defaultValue={user?.displayName || ""} required className="h-11 sm:h-12 bg-secondary/30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requestType" className="text-xs sm:text-sm font-bold opacity-70">{t.prayerFormType}</Label>
                    <Select name="requestType" defaultValue="prayer">
                      <SelectTrigger id="requestType" className="h-11 sm:h-12 bg-secondary/30">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prayer">{t.prayerTypePrayer}</SelectItem>
                        <SelectItem value="puja">{t.prayerTypePuja}</SelectItem>
                        <SelectItem value="other">{t.prayerTypeOther}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="prayer-email" className="text-xs sm:text-sm font-bold opacity-70">{t.contactFormEmail}</Label>
                    <Input id="prayer-email" name="email" type="email" defaultValue={user?.email || ""} className="h-11 sm:h-12 bg-secondary/30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prayer-phone" className="text-xs sm:text-sm font-bold opacity-70">{language === 'hi' ? 'संपर्क नंबर' : 'Phone Number'}</Label>
                    <Input id="prayer-phone" name="phone" className="h-11 sm:h-12 bg-secondary/30" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prayer-message" className="text-xs sm:text-sm font-bold opacity-70">{language === 'hi' ? 'निवेदन का विवरण' : 'Request Details'}</Label>
                  <Textarea 
                    id="prayer-message" 
                    name="message" 
                    className="min-h-[120px] sm:min-h-[140px] bg-secondary/30 resize-none" 
                    placeholder={language === 'hi' ? 'यहाँ अपनी प्रार्थना या पूजा का विवरण लिखें...' : 'Write your prayer or ritual details here...'} 
                    required 
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" size="lg" className={cn("w-full h-12 sm:h-14 font-bold shadow-lg", language === 'hi' ? 'text-lg' : '')} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    {t.contactFormSend}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
