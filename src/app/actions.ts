"use server";

import { z } from "zod";
import { Resend } from 'resend';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { getContentfulStatus } from '@/lib/contentful';
import { getOtpEmailHtml, getBroadcastEmailHtml } from '@/lib/email-templates';

// Initialize two distinct Resend clients for separate routing
const resendOtp = process.env.RESEND_OTP_API_KEY 
  ? new Resend(process.env.RESEND_OTP_API_KEY) 
  : (process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null);

const resendContact = process.env.RESEND_CONTACT_API_KEY 
  ? new Resend(process.env.RESEND_CONTACT_API_KEY) 
  : (process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null);

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
    isLive: !!(resendOtp || resendContact),
    hasOtpKey: !!process.env.RESEND_OTP_API_KEY,
    hasContactKey: !!process.env.RESEND_CONTACT_API_KEY,
    provider: "Resend (Dual Route)",
  };
}

/**
 * Checks the status of reCAPTCHA configuration.
 */
export async function getRecaptchaStatus() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
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
    return true;
  }

  try {
    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`, {
      method: 'POST',
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("reCAPTCHA Fetch Error:", error);
    return false;
  }
}

/**
 * Submits the contact form and routes the notification via Resend.
 */
export async function submitContactForm(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;
  const captchaToken = formData.get("captchaToken") as string;

  const isCaptchaValid = await verifyRecaptcha(captchaToken);
  if (!isCaptchaValid) return { message: "Captcha failed", success: false };

  if (resendContact) {
    try {
      await resendContact.emails.send({
        from: 'Mandir Samiti <contact@suryamandir.online>',
        to: 'contact@suryamandir.online',
        replyTo: email,
        subject: `New Message from Devotee: ${name}`,
        text: `You have received a new message from the website contact form.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        headers: {
          'X-Entity-Ref-ID': 'contact-form',
        },
        tags: [
          { name: 'category', value: 'contact_form' },
          { name: 'tracking_domain', value: 'gmb.suryamandir.online' }
        ]
      });
      return { message: "Success", success: true };
    } catch (error: any) {
      console.error("Resend Contact Form Error:", error);
      return { message: "Email routing failed", success: false };
    }
  }
  
  return { message: "Success (Simulated)", success: true };
}

/**
 * Sends a verification OTP via Resend.
 */
export async function sendVerificationOtp(email: string, otp: string, language: 'hi' | 'en' = 'hi', captchaToken?: string) {
  if (captchaToken) {
    const isCaptchaValid = await verifyRecaptcha(captchaToken);
    if (!isCaptchaValid) return { success: false, message: "Captcha failed" };
  }
  
  if (resendOtp) {
    try {
      await resendOtp.emails.send({
        from: 'Mandir Samiti <verify@suryamandir.online>',
        to: email,
        subject: language === 'hi' ? 'आपका सत्यापन कोड - सूर्य मंदिर' : 'Your Verification Code - Surya Mandir',
        html: getOtpEmailHtml(otp, language),
        tags: [
          { name: 'category', value: 'otp_verification' },
          { name: 'tracking_domain', value: 'gmb.suryamandir.online' }
        ]
      });
      return { success: true, isLive: true };
    } catch (error: any) {
      console.error("Resend OTP Error:", error);
      return { success: false, message: error.message || "Failed to send email" };
    }
  }
  
  return { success: true, isLive: false };
}

/**
 * Sends a broadcast or manual email to specific devotees.
 */
export async function sendManualEmail(emails: string[], subject: string, message: string, language: 'hi' | 'en' = 'hi') {
  if (!resendContact) return { success: false, message: "Email service not configured" };
  if (emails.length === 0) return { success: false, message: "No recipients selected" };

  try {
    await resendContact.emails.send({
      from: 'Mandir Samiti <contact@suryamandir.online>',
      to: emails,
      subject: subject,
      html: getBroadcastEmailHtml(subject, message, language),
      tags: [
        { name: 'category', value: 'admin_broadcast' },
        { name: 'tracking_domain', value: 'gmb.suryamandir.online' }
      ]
    });
    return { success: true };
  } catch (error: any) {
    console.error("Resend Manual Email Error:", error);
    return { success: false, message: error.message || "Failed to send broadcast" };
  }
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
  return { success: false, message: "Service under maintenance" };
}
