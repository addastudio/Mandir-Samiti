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
 * NOTE: In this prototype/development environment, real emails are NOT sent.
 * The code is logged here and displayed on the UI for testing purposes.
 */
export async function sendVerificationOtp(email: string, otp: string) {
  console.log("");
  console.log("==========================================");
  console.log("      [SIMULATED EMAIL SERVICE LOG]      ");
  console.log("==========================================");
  console.log(`TIME:    ${new Date().toISOString()}`);
  console.log(`TO:      ${email}`);
  console.log(`SUBJECT: Mandir Samiti Bahpura - OTP`);
  console.log(`OTP:     ${otp}`);
  console.log("==========================================");
  console.log("");
  
  return { success: true };
}
