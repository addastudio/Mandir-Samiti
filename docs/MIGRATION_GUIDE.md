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

## 3. Netlify Deployment (Production)
1. **Connect:** Go to Netlify.com and select "Import from GitHub".
2. **Configure:** Choose your repository and set the build command to `npm run build` and directory to `.next`.
3. **Environment Variables:** Go to **Site Settings > Environment variables** and add:
   - `STRIPE_SECRET_KEY`
   - `CASHFREE_APP_ID` & `CASHFREE_SECRET_KEY`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - `RECAPTCHA_SECRET_KEY`
   - `CONTENTFUL_SPACE_ID` & `CONTENTFUL_ACCESS_TOKEN` (if using CMS)
4. **Deploy:** Netlify will automatically build and assign a `.netlify.app` URL.

---

## 4. Firebase Project Setup
1. **Console:** Visit console.firebase.google.com.
2. **Provision:**
   - **Firestore:** Enable in Production mode.
   - **Auth:** Enable Email/Password and Google providers.
3. **Rules:** Deploy the provided `firestore.rules` from this repository.

---

## 5. Domain Name
- **Recommendation:** Use a `.org` or `.in` domain (approx. ₹800/year).
- **Mapping:** In Netlify, go to **Domain management > Add custom domain**. Update your DNS records at your registrar (GoDaddy, Namecheap, etc.) to point to Netlify's name servers.

