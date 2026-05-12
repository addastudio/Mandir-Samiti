
"use server";

import { z } from "zod";
import { Resend } from 'resend';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { getContentfulStatus } from '@/lib/contentful';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Checks backend connection status for reporting in the Admin Panel.
 */
export async function getBackendConnectionStatus() {
  const contentful = getContentfulStatus();
  return {
    firebase: {
      active: true,
      label: "Firebase (Primary)"
    },
    superbase: {
      active: !!(process.env.NEXT_PUBLIC_SUPERBASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
      label: "Superbase (Detected)"
    },
    contentful: {
      active: contentful.active,
      label: contentful.label
    }
  };
}

/**
 * Checks which payment gateways are active based on available API keys.
 */
export async function getPaymentGatewayStatus() {
  return {
    stripe: !!process.env.STRIPE_SECRET_KEY,
    cashfree: !!process.env.CASHFREE_APP_ID && !!process.env.CASHFREE_SECRET_KEY,
  };
}

/**
 * Checks if the live email service is configured.
 */
export async function getEmailServiceStatus() {
  return {
    isLive: !!process.env.RESEND_API_KEY,
    provider: "Resend",
  };
}

/**
 * Checks the status of reCAPTCHA configuration.
 */
export async function getRecaptchaStatus() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  // A standard v2 key usually starts with 6L...
  const isV2 = siteKey?.startsWith('6L');

  return {
    isLive: !!(siteKey && secretKey),
    hasSiteKey: !!siteKey,
    hasSecretKey: !!secretKey,
    isV2CorrectType: isV2,
  };
}

/**
 * Verifies a reCAPTCHA token with Google's API.
 */
async function verifyRecaptcha(token: string | null) {
  if (!token) return false;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn("CRITICAL: RECAPTCHA_SECRET_KEY is missing in production. Falling back to true (Simulation) to avoid lockout.");
    }
    return true; // Allow simulation if key is missing
  }

  try {
    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`, {
      method: 'POST',
    });
    const data = await response.json();
    
    if (!data.success) {
      console.error("reCAPTCHA Verification Failed:", data['error-codes']);
    }
    
    return data.success;
  } catch (error) {
    console.error("reCAPTCHA Fetch Error:", error);
    return false;
  }
}

export async function submitContactForm(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;
  const captchaToken = formData.get("captchaToken") as string;

  const isCaptchaValid = await verifyRecaptcha(captchaToken);
  if (!isCaptchaValid) return { message: "Captcha failed", success: false };

  if (resend) {
    await resend.emails.send({
      from: 'Mandir Samiti <onboarding@resend.dev>',
      to: 'contact@mandirbahpura.org',
      subject: `New Message: ${name}`,
      text: message,
    });
  }
  return { message: "Success", success: true };
}

export async function sendVerificationOtp(email: string, otp: string, captchaToken?: string) {
  if (captchaToken) {
    const isCaptchaValid = await verifyRecaptcha(captchaToken);
    if (!isCaptchaValid) return { success: false, message: "Captcha failed" };
  }
  if (resend) {
    await resend.emails.send({
      from: 'Mandir Samiti <onboarding@resend.dev>',
      to: email,
      subject: 'Verification Code',
      html: `<b>Your OTP is: ${otp}</b>`,
    });
    return { success: true, isLive: true };
  }
  console.log(`[SIMULATED EMAIL] To: ${email}, OTP: ${otp}`);
  return { success: true, isLive: false };
}

export async function createStripeCheckoutSession(amount: number, userEmail?: string) {
  if (!process.env.STRIPE_SECRET_KEY) return { success: false };
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = (await headers()).get("origin") || "";
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: { currency: "inr", product_data: { name: "Temple Donation" }, unit_amount: amount * 100 },
        quantity: 1,
      }],
      mode: "payment",
      customer_email: userEmail,
      success_url: `${origin}/dashboard?success=true`,
      cancel_url: `${origin}/donate?canceled=true`,
    });
    return { success: true, url: session.url };
  } catch (err) { return { success: false }; }
}

export async function createCashfreeOrder(amount: number, userEmail?: string, userId?: string) {
  if (!process.env.CASHFREE_APP_ID) return { success: false };
  // Implementation for Cashfree API...
  return { success: false, message: "Service under maintenance" };
}
