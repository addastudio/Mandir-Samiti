"use client";

import ReCAPTCHA from "react-google-recaptcha";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShieldCheck, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

/**
 * Reusable reCAPTCHA component with hardened security UI.
 * Integrates with standard Google keys or environment-defined keys.
 */
export function RecaptchaWidget({ onChange, className }: { onChange: (token: string | null) => void, className?: string }) {
  const { language } = useLanguage();
  
  // Use the official Google testing key as a fallback if the env var isn't set.
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
  const isSimulation = siteKey === "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
  const isProd = process.env.NODE_ENV === 'production';

  return (
    <div className={cn(
      "relative bg-secondary/40 border border-primary/10 rounded-2xl p-4 sm:p-6 transition-all hover:border-primary/20 hover:bg-secondary/60 shadow-sm overflow-hidden",
      className
    )}>
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-24 h-24 bg-primary/5 rounded-full blur-2xl -z-10" />
      
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-full shadow-inner ring-1 ring-primary/20">
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
        
        {isSimulation && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded border animate-pulse",
            isProd ? "bg-red-100 border-red-200" : "bg-amber-100 border-amber-200"
          )}>
            {isProd ? <AlertTriangle className="h-3 w-3 text-red-700" /> : <AlertCircle className="h-3 w-3 text-amber-700" />}
            <span className={cn("text-[8px] font-black uppercase tracking-tighter", isProd ? "text-red-800" : "text-amber-800")}>
              {isProd ? 'Security Config Error' : 'Simulation Mode'}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex justify-center overflow-hidden rounded-xl border border-black/5 bg-white/50 p-1 shadow-inner backdrop-blur-sm min-h-[78px]">
        <ReCAPTCHA
          sitekey={siteKey}
          onChange={onChange}
          hl={language}
          theme="light"
        />
      </div>
      
      {!isSimulation && !siteKey.startsWith('6L') && (
        <p className="mt-2 text-[9px] text-destructive font-bold text-center">
          Warning: Site key format mismatch. Ensure you are using reCAPTCHA v2 keys.
        </p>
      )}
    </div>
  );
}
