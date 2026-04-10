
"use client";

import ReCAPTCHA from "react-google-recaptcha";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable reCAPTCHA component that handles language and standard keys.
 * Centralized styling for a consistent "pretty and professional" look.
 */
export function RecaptchaWidget({ onChange, className }: { onChange: (token: string | null) => void, className?: string }) {
  const { language } = useLanguage();
  
  // Use the official Google testing key as a fallback if the env var isn't set.
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

  return (
    <div className={cn(
      "relative bg-secondary/40 border border-primary/10 rounded-2xl p-4 sm:p-6 transition-all hover:border-primary/20 hover:bg-secondary/60 shadow-sm",
      className
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary/10 p-2 rounded-full shadow-inner">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground leading-none">
            {language === 'hi' ? 'सुरक्षा सत्यापन' : 'Security Verification'}
          </span>
          <span className="text-[9px] text-muted-foreground/70 font-medium mt-1">
            {language === 'hi' ? 'पुष्टि करें कि आप मानव हैं' : 'Verify you are human to proceed'}
          </span>
        </div>
      </div>
      
      <div className="flex justify-center overflow-hidden rounded-xl border border-black/5 bg-white/50 p-1 shadow-inner">
        <ReCAPTCHA
          sitekey={siteKey}
          onChange={onChange}
          hl={language}
          theme="light"
        />
      </div>
    </div>
  );
}
