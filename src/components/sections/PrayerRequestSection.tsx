
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
import { HandsPraying } from "lucide-react";

// Lucide doesn't have HandsPraying, using inline SVG for the spiritual feel
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
    <section id="prayer" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-4xl font-bold tracking-tight sm:text-5xl text-text-accent flex items-center justify-center gap-3",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            <PrayerIcon className="h-10 w-10 text-primary" />
            {t.prayerTitle}
          </h2>
          <p className={cn("mt-4 text-lg text-muted-foreground", language === 'hi' ? 'font-hindi' : '')}>
            {t.prayerSubtitle}
          </p>
        </div>

        <div className="mt-16 max-w-2xl mx-auto">
          <Card className="shadow-xl border-primary/10">
            <CardHeader className="bg-primary/5">
              <CardTitle className={cn(language === 'hi' ? 'font-hindi' : '')}>{language === 'hi' ? 'निवेदन फॉर्म' : 'Request Form'}</CardTitle>
              <CardDescription className={cn(language === 'hi' ? 'font-hindi' : '')}>
                {language === 'hi' ? 'कृपया अपनी जानकारी और निवेदन विस्तार से भरें।' : 'Please fill in your details and request clearly.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="prayer-name">{t.contactFormName}</Label>
                    <Input id="prayer-name" name="name" defaultValue={user?.displayName || ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requestType">{t.prayerFormType}</Label>
                    <Select name="requestType" defaultValue="prayer">
                      <SelectTrigger id="requestType">
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="prayer-email">{t.contactFormEmail}</Label>
                    <Input id="prayer-email" name="email" type="email" defaultValue={user?.email || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prayer-phone">{language === 'hi' ? 'संपर्क नंबर' : 'Phone Number'}</Label>
                    <Input id="prayer-phone" name="phone" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prayer-message">{language === 'hi' ? 'निवेदन का विवरण' : 'Request Details'}</Label>
                  <Textarea 
                    id="prayer-message" 
                    name="message" 
                    className="min-h-[120px]" 
                    placeholder={language === 'hi' ? 'यहाँ अपनी प्रार्थना या पूजा का विवरण लिखें...' : 'Write your prayer or ritual details here...'} 
                    required 
                  />
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? '...' : t.contactFormSend}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
