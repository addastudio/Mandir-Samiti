"use server";

import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

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
    // Here you would typically send an email, save to a database, etc.
    console.log("Contact Form Submitted:");
    console.log(validatedFields.data);

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
 * Simulates sending a verification OTP to the user's email.
 * In production, this would use a service like SendGrid, Mailgun, or AWS SES.
 */
export async function sendVerificationOtp(email: string, otp: string) {
  console.log("------------------------------------------");
  console.log(`[SIMULATED EMAIL SERVICE]`);
  console.log(`TO: ${email}`);
  console.log(`SUBJECT: Your Mandir Samiti Bahpura Verification Code`);
  console.log(`BODY: Your verification code is: ${otp}`);
  console.log("------------------------------------------");
  
  return { success: true };
}
