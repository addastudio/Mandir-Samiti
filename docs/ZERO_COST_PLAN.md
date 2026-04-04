# Zero-Cost Deployment Plan: Mandir Samiti Bahpura

This plan outlines how to publish and maintain the temple website with **zero monthly costs**, utilizing the free tiers of modern cloud services.

---

## 1. Hosting: Vercel (Hobby Tier)
While Firebase App Hosting requires a "Blaze" (pay-as-you-go) plan for Next.js SSR, **Vercel** offers a generous free tier for non-commercial/community projects.
- **Cost:** $0/month.
- **Action:** 
  1. Push your code to GitHub.
  2. Connect your GitHub repo to [Vercel.com](https://vercel.com).
  3. Vercel will automatically detect Next.js and deploy it.

## 2. Database & Auth: Firebase (Spark Plan)
Firebase's "Spark Plan" is free forever and perfect for a temple's traffic levels.
- **Firestore (Database):**
  - **Free Limit:** 50,000 reads and 20,000 writes per day.
  - **Storage:** 1GB of data (plenty for thousands of notices/events).
- **Authentication:** 
  - **Free Limit:** Unlimited for standard Email/Password and Google Sign-in.
- **Action:** Ensure your project is on the **Spark Plan** in the Firebase Console Settings.

## 3. Email: Resend (Free Tier)
Used for sending OTPs and contact form alerts.
- **Cost:** $0/month.
- **Free Limit:** 3,000 emails per month (approx. 100 per day).
- **Action:** Sign up at [Resend.com](https://resend.com) and verify your domain to get an API key.

## 4. Payments: Stripe (Pay-as-you-go)
Stripe has no monthly fees. They only take a small percentage of each successful donation.
- **Cost:** $0/month (only ~2-3% per transaction).
- **Action:** Stay in "Live Mode" on Stripe. If no one donates, you pay nothing.

## 5. Domain Name: .org or .in
This is the only unavoidable cost (approx. ₹600 - ₹1000 per year).
- **Recommendation:** Use a registrar like **Namecheap** or **Cloudflare** for the lowest rates.
- **Alternative:** Use the free `.vercel.app` subdomain provided by Vercel (e.g., `mandirbahpura.vercel.app`).

---

## Summary of Setup Steps
1. **GitHub:** Upload code to a private or public repository.
2. **Firebase:** Enable Firestore and Auth. Set rules. Keep on Spark Plan.
3. **Vercel:** Connect GitHub. Add your Environment Variables (`STRIPE_SECRET_KEY`, `RESEND_API_KEY`, etc.).
4. **Launch:** Map your custom domain to Vercel.

---
**Note:** To save this as a PDF, press **Ctrl+P** (Windows) or **Cmd+P** (Mac) while viewing this file and select **"Save as PDF"**.