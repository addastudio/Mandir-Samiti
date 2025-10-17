"use client";

import { useEffect, useActionState } from "react";
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
    <Button type="submit" disabled={pending} className={cn(language === 'hi' ? 'font-hindi' : '')}>
      {pending ? (language === 'hi' ? "भेज रहा है..." : "Sending...") : t.contactFormSend}
    </Button>
  );
}

export function ContactSection() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const initialState = { message: "", success: false, errors: {} };
  const [state, formAction] = useActionState(submitContactForm, initialState);

  useEffect(() => {
    if(state.message) {
      if (state.success) {
        toast({
          title: language === 'hi' ? "सफलता" : "Success",
          description: t.contactFormSuccess,
        });
      } else if (state.message && !state.success) {
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
    <section id="contact" className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className={cn(
              "text-3xl font-bold tracking-tight sm:text-4xl",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            {t.contactTitle}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <MapPin className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Address</h3>
                <p className={cn("text-muted-foreground", language === 'hi' ? 'font-hindi' : '')}>{t.contactAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Phone</h3>
                <p className="text-muted-foreground">{t.contactPhone}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-muted-foreground">{t.contactEmail}</p>
              </div>
            </div>
            <div className="pt-4">
               <h3 className={cn("font-semibold mb-2", language === 'hi' ? 'font-hindi' : '')}>{t.contactFollow}</h3>
               <div className="flex space-x-4">
                 {socialLinks.map(link => (
                   <a key={link.name} href={link.href} aria-label={link.name} className="text-muted-foreground hover:text-primary">
                     <link.icon className="h-6 w-6"/>
                   </a>
                 ))}
               </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className={cn(language === 'hi' ? 'font-hindi' : '')}>{t.contactFormMessage}</CardTitle>
                <CardDescription className={cn(language === 'hi' ? 'font-hindi' : '')}>
                  {language === 'hi' ? 'आपका कोई प्रश्न या प्रतिक्रिया है? हमें आपसे सुनना अच्छा लगेगा।' : 'Have a question or feedback? We\'d love to hear from you.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={formAction} className="space-y-4">
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
        
        <div className="mt-12">
            <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <p>Google Map Placeholder</p>
            </div>
        </div>
      </div>
    </section>
  );
}
