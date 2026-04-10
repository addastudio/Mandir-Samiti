
"use client";

import ReCAPTCHA from "react-google-recaptcha";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Reusable reCAPTCHA component that handles language and standard keys.
 */
export function RecaptchaWidget({ onChange }: { onChange: (token: string | null) => void }) {
  const { language } = useLanguage();
  
  // Use the official Google testing key as a fallback if the env var isn't set.
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

  return (
    <div className="flex justify-center my-4 overflow-hidden rounded-lg">
      <ReCAPTCHA
        sitekey={siteKey}
        onChange={onChange}
        hl={language}
      />
    </div>
  );
}
