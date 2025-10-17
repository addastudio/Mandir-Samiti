"use client";

import { useEffect, useActionState, useState } from "react";
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
} from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t, language } = useLanguage();

  return (
    <Button type="submit" disabled={pending} className={cn('w-full md:w-auto', language === 'hi' ? 'font-hindi' : '')}>
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

  useEffect(() => {
    if(state.message) {
      if (state.success) {
        toast({
          title: language === 'hi' ? "सफलता" : "Success",
          description: t.contactFormSuccess,
        });
        setFormKey(prev => prev + 1); // Reset form
      } else if (state.message && !state.success && Object.keys(state.errors || {}).length > 0) {
        // Don't show toast for validation errors, they are shown inline
      }
       else if (state.message && !state.success) {
        toast({
          variant: "destructive",
          title: language === 'hi' ? "त्रुटि" : "Error",
          description: t.contactFormError,
        });
      }
    }
  }, [state, toast, t, language]);

  const socialLinks = [
    { icon: Facebook, href: "#", name: "Facebook" },
    { icon: Instagram, href: "#", name: "Instagram" },
    { icon: Youtube, href: "#", name: "Youtube" },
  ];

  return (
    <section id="contact" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-4xl font-bold tracking-tight sm:text-5xl text-text-accent",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            {t.contactTitle}
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">{t.contactAddress.split(':')[0]}</h3>
                <p className={cn("text-muted-foreground", language === 'hi' ? 'font-hindi' : '')}>{t.contactAddress.split(':')[1]}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">{t.contactPhone.split(':')[0]}</h3>
                <p className="text-muted-foreground">{t.contactPhone.split(':')[1]}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">{t.contactEmail.split(':')[0]}</h3>
                <p className="text-muted-foreground">{t.contactEmail.split(':')[1]}</p>
              </div>
            </div>
            <div className="pt-4">
               <h3 className={cn("font-semibold text-lg mb-3", language === 'hi' ? 'font-hindi' : '')}>{t.contactFollow}</h3>
               <div className="flex space-x-4">
                 {socialLinks.map(link => (
                   <a key={link.name} href={link.href} aria-label={link.name} className="text-muted-foreground hover:text-primary transition-colors">
                     <link.icon className="h-7 w-7"/>
                   </a>
                 ))}
               </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className={cn("text-2xl", language === 'hi' ? 'font-hindi' : '')}>{t.contactFormMessage}</CardTitle>
                <CardDescription className={cn(language === 'hi' ? 'font-hindi' : '')}>
                  {language === 'hi' ? 'आपका कोई प्रश्न या प्रतिक्रिया है? हमें आपसे सुनना अच्छा लगेगा।' : 'Have a question or feedback? We\'d love to hear from you.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form key={formKey} action={formAction} className="space-y-4">
                  <div>
                    <Input name="name" placeholder={t.contactFormName} className={cn(language === 'hi' ? 'font-hindi' : '')} />
                    {state.errors?.name && <p className="text-sm font-medium text-destructive mt-1">{state.errors.name[0]}</p>}
                  </div>
                  <div>
                    <Input name="email" type="email" placeholder={t.contactFormEmail} className={cn(language === 'hi' ? 'font-hindi' : '')} />
                     {state.errors?.email && <p className="text-sm font-medium text-destructive mt-1">{state.errors.email[0]}</p>}
                  </div>
                  <div>
                    <Textarea name="message" placeholder={t.contactFormMessage} className={cn(language === 'hi' ? 'font-hindi' : '')} />
                     {state.errors?.message && <p className="text-sm font-medium text-destructive mt-1">{state.errors.message[0]}</p>}
                  </div>
                  <SubmitButton />
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mt-16">
            <div className="aspect-video w-full rounded-lg overflow-hidden shadow-lg">
              <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3549.442755910103!2d78.008074!3d27.175144!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39747121d702ff6d%3A0xdd2ae4803f767dde!2sTaj%20Mahal!5e0!3m2!1sen!2sin!4v1628610423093!5m2!1sen!2sin"
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
