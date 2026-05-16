"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { submitContactForm } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Youtube,
  ShieldCheck,
} from "lucide-react";
import { RecaptchaWidget } from "@/components/RecaptchaWidget";
import { getContentfulSiteContent } from "@/lib/contentful";

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  const { t, language } = useLanguage();

  return (
    <Button 
      type="submit" 
      disabled={pending || disabled} 
      className={cn('w-full sm:w-auto min-w-[140px] font-bold h-11 sm:h-12', language === 'hi' ? 'font-hindi text-lg' : '')}
    >
      {pending ? (language === 'hi' ? "भेज रहा है..." : "Sending...") : t.contactFormSend}
    </Button>
  );
}

export function ContactSection() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const initialState = { message: "", success: false, errors: {} };
  const [state, formAction] = useActionState(submitContactForm, initialState);
  const [formKey, setFormKey] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [cmsContent, setCmsContent] = useState<any>(null);

  useEffect(() => {
    getContentfulSiteContent().then(setCmsContent);
  }, []);

  useEffect(() => {
    if(state.message) {
      if (state.success) {
        toast({
          title: language === 'hi' ? "सफलता" : "Success",
          description: t.contactFormSuccess,
        });
        setFormKey(prev => prev + 1); 
        setCaptchaToken(null);
      } else if (state.message.includes("Captcha")) {
        toast({
          variant: "destructive",
          title: language === 'hi' ? "सुरक्षा जांच विफल" : "Security Check Failed",
          description: t.captchaError,
        });
      }
    }
  }, [state, toast, t, language]);

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.suryamandir.online", name: "Facebook" },
    { icon: Instagram, href: "#", name: "Instagram" },
    { icon: Youtube, href: "https://youtube.suryamandir.online", name: "Youtube" },
  ];

  const address = language === 'hi' 
    ? (cmsContent?.hiAddress || t.contactAddress)
    : (cmsContent?.enAddress || t.contactAddress);

  const phone = cmsContent?.phone || t.contactPhone;
  const email = cmsContent?.email || t.contactEmail;
  const mapUrl = cmsContent?.mapUrl || "https://maps.app.goo.gl/oookdABLpqNCjgga7";

  return (
    <section id="contact" className="py-16 sm:py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-3xl xs:text-4xl font-bold tracking-tight sm:text-5xl text-text-accent flex items-center justify-center gap-2 sm:gap-3",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            <Phone className="h-7 w-7 sm:h-8 sm:w-8" />
            {t.contactTitle}
          </h2>
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="space-y-8 sm:space-y-10">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="bg-primary/10 p-2.5 sm:p-3 rounded-xl shrink-0">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg">{address.includes(':') ? address.split(':')[0] : (language === 'hi' ? 'पता' : 'Address')}</h3>
                <p className={cn("text-muted-foreground text-sm sm:text-base mt-1", language === 'hi' ? 'font-hindi' : '')}>{address.includes(':') ? address.split(':')[1] : address}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="bg-primary/10 p-2.5 sm:p-3 rounded-xl shrink-0">
                <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg">{phone.includes(':') ? phone.split(':')[0] : (language === 'hi' ? 'फ़ोन' : 'Phone')}</h3>
                <p className="text-muted-foreground text-sm sm:text-base mt-1">{phone.includes(':') ? phone.split(':')[1] : phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="bg-primary/10 p-2.5 sm:p-3 rounded-xl shrink-0">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg">{email.includes(':') ? email.split(':')[0] : (language === 'hi' ? 'ईमेल' : 'Email')}</h3>
                <p className="text-muted-foreground text-sm sm:text-base mt-1">{email.includes(':') ? email.split(':')[1] : email}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border/40">
               <h3 className={cn("font-bold text-base sm:text-lg mb-4", language === 'hi' ? 'font-hindi' : '')}>{t.contactFollow}</h3>
               <div className="flex space-x-3 sm:space-x-4">
                 {socialLinks.map(link => (
                   <a 
                    key={link.name} 
                    href={link.href} 
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.name} 
                    className="bg-secondary p-2.5 sm:p-3 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                   >
                     <link.icon className="h-5 w-5 sm:h-6 sm:w-6"/>
                   </a>
                 ))}
               </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <Card className="shadow-xl border-primary/10 overflow-hidden">
              <CardHeader className="bg-primary/5 p-5 sm:p-8">
                <CardTitle className={cn("text-xl sm:text-2xl font-bold", language === 'hi' ? 'font-hindi' : '')}>{t.contactFormMessage}</CardTitle>
                <CardDescription className={cn("text-sm sm:text-base mt-2", language === 'hi' ? 'font-hindi' : '')}>
                  {language === 'hi' ? 'आपका कोई प्रश्न या प्रतिक्रिया है? हमें आपसे सुनना अच्छा लगेगा।' : 'Have a question or feedback? We\'d love to hear from you.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-8">
                <form key={formKey} action={formAction} className="space-y-5">
                  <input type="hidden" name="captchaToken" value={captchaToken || ""} />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Input name="name" placeholder={t.contactFormName} className={cn("h-11 sm:h-12 bg-secondary/30", language === 'hi' ? 'font-hindi' : '')} required />
                    </div>
                    <div className="space-y-2">
                      <Input name="email" type="email" placeholder={t.contactFormEmail} className={cn("h-11 sm:h-12 bg-secondary/30", language === 'hi' ? 'font-hindi' : '')} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Textarea name="message" placeholder={t.contactFormMessage} className={cn("min-h-[140px] sm:min-h-[160px] bg-secondary/30 resize-none", language === 'hi' ? 'font-hindi' : '')} required />
                  </div>

                  <div className="space-y-2 pt-2">
                    <RecaptchaWidget onChange={(token) => setCaptchaToken(token)} />
                  </div>

                  <div className="pt-2">
                    <SubmitButton disabled={!captchaToken} />
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mt-16 sm:mt-24">
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
              <iframe
                  src={mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Map of Bahpura"
                ></iframe>
            </div>
        </div>
      </div>
    </section>
  );
}
