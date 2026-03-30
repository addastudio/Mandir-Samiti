"use server";

import { z } from "zod";
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

/**
 * Checks if the live email service is configured.
 * This is used by the admin panel to show the system status.
 */
export async function getEmailServiceStatus() {
  return {
    isLive: !!process.env.RESEND_API_KEY,
    provider: "Resend",
  };
}

export async function submitContactForm(prevState: any, formData: FormData) {
  const validatedFields = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed.",
      success: false,
    };
  }

  try {
    // If live email is connected, send contact form details to admin
    if (resend) {
      await resend.emails.send({
        from: 'Mandir Samiti Website <onboarding@resend.dev>',
        to: 'contact@mandirbahpura.org',
        subject: `New Contact Form Submission: ${validatedFields.data.name}`,
        html: `
          <h3>New Contact Message</h3>
          <p><strong>Name:</strong> ${validatedFields.data.name}</p>
          <p><strong>Email:</strong> ${validatedFields.data.email}</p>
          <p><strong>Message:</strong></p>
          <p>${validatedFields.data.message}</p>
        `,
      });
    }

    console.log("Contact Form Submitted:", validatedFields.data);

    return {
      message: "Form submitted successfully!",
      success: true,
    };
  } catch (error) {
    console.error("Error submitting form:", error);
    return {
      message: "An unexpected error occurred.",
      success: false,
    };
  }
}

/**
 * Sends a verification OTP to the user's email.
 * If RESEND_API_KEY is present in environment variables, it sends a real email.
 * Otherwise, it logs the OTP to the console for development/prototype testing.
 */
export async function sendVerificationOtp(email: string, otp: string) {
  // Try sending real email if API key is configured
  if (resend) {
    try {
      await resend.emails.send({
        from: 'Mandir Samiti Bahpura <onboarding@resend.dev>',
        to: email,
        subject: 'Mandir Samiti Bahpura - OTP Verification Code',
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
            <h2 style="color: #e67e22; text-align: center;">Mandir Samiti Bahpura</h2>
            <p>Welcome to our community! Please use the following code to verify your account:</p>
            <div style="background: #fdf2e9; padding: 20px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #d35400; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
              This code will expire in 10 minutes. If you did not request this, please ignore this email.
            </p>
          </div>
        `,
      });
      console.log(`[LIVE EMAIL SENT] OTP sent to ${email}`);
      return { success: true };
    } catch (error) {
      console.error("Failed to send real email via Resend:", error);
      // Fallback to console simulation below
    }
  }

  // DEVELOPMENT SIMULATION LOG
  console.log("");
  console.log("==========================================");
  console.log("      [SIMULATED EMAIL SERVICE LOG]      ");
  console.log("==========================================");
  console.log(`TIME:    ${new Date().toISOString()}`);
  console.log(`TO:      ${email}`);
  console.log(`SUBJECT: Mandir Samiti Bahpura - OTP`);
  console.log(`OTP:     ${otp}`);
  console.log(`STATUS:  PROTOTYPE MODE (Real email NOT sent)`);
  console.log("==========================================");
  console.log("");
  
  return { success: true };
}
