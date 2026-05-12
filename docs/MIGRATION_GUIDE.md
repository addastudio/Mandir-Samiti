
# Mandir Bahpura - Migration & Deployment Guide

This guide outlines the process for migrating to production and maintaining the site at **Zero Cost** using Netlify.

---

## 1. Zero-Cost Strategy
For community non-profits, we recommend this free-tier stack:
- **Hosting:** Netlify (Starter Tier) - $0/mo.
- **Database:** Firebase (Spark Plan) - $0/mo (up to 50k reads/day).
- **Email:** Resend (Free Tier) - $0/mo (3,000 emails/mo).
- **Payments:** Stripe (Pay-as-you-go) - Only takes a small % of successful donations.

---

## 2. GitHub Setup
1. **Initialize Git:** `git init`
2. **Create Repository:** Create a new private repo on GitHub.
3. **Push Code:** `git add . && git commit -m "Initial commit" && git push`

---

## 3. Netlify/Vercel Deployment (Production)
1. **Connect:** Go to Netlify.com or Vercel.com and select "Import from GitHub".
2. **Configure:** Choose your repository and set the build command to `npm run build` and directory to `.next`.
3. **Environment Variables:** Go to **Site Settings > Environment variables** and add:
   - `STRIPE_SECRET_KEY`
   - `CASHFREE_APP_ID` & `CASHFREE_SECRET_KEY`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (MUST use reCAPTCHA v2 Checkbox)
   - `RECAPTCHA_SECRET_KEY` (MUST use reCAPTCHA v2 Checkbox)
   - `CONTENTFUL_SPACE_ID` & `CONTENTFUL_ACCESS_TOKEN` (if using CMS)
   - `NEXT_PUBLIC_NETLIFY_SITE_URL`: `https://mandirsamiti.netlify.app` (Required for CMS Login)
4. **Deploy:** The platform will automatically build and assign a URL.

---

## 4. Setting up Production reCAPTCHA (IMPORTANT)
To remove the "Simulation" banner from `www.suryamandir.online`:
1.  Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin).
2.  Register a new site.
3.  **Label:** Surya Mandir Bahpura
4.  **reCAPTCHA type:** Select **reCAPTCHA v2**.
5.  **Sub-type:** Select **"I'm not a robot" Checkbox**. (Do NOT use v3 as it requires different code).
6.  **Domains:** Add `suryamandir.online` and `mandirsamiti.netlify.app`.
7.  Copy the **Site Key** and **Secret Key**.
8.  Add them as `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY` in your Vercel/Netlify dashboard.
9.  **REDEPLOY:** In Vercel, go to the "Deployments" tab and click "Redeploy" on your latest build to apply these new environment variables.

---

## 5. Firebase Project Setup
1. **Console:** Visit console.firebase.google.com.
2. **Provision:**
   - **Firestore:** Enable in Production mode.
   - **Auth:** Enable Email/Password and Google providers.
3. **Rules:** Deploy the provided `firestore.rules` from this repository.

---

## 6. Domain Name
- **Recommendation:** Use a `.org` or `.in` domain (approx. ₹800/year).
- **Mapping:** In Netlify/Vercel, go to **Domain management > Add custom domain**. Update your DNS records at your registrar to point to the hosting provider's name servers.
