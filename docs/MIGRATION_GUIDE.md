
# Mandir Bahpura - Migration & Deployment Guide

This guide outlines the process for migrating to production and maintaining the site at **Zero Cost** using Netlify and Vercel.

---

## 1. Zero-Cost Strategy
For community non-profits, we recommend this free-tier stack:
- **Hosting:** Netlify (Starter Tier) - $0/mo.
- **Database:** Firebase (Spark Plan) - $0/mo (up to 50k reads/day).
- **Email:** Resend (Free Tier) - $0/mo (3,000 emails/mo).
- **Payments:** Stripe (Pay-as-you-go) - Only takes a small % of successful donations.

---

## 2. Professional Subdomains & DNS (GoDaddy)
To maintain a professional presence, the following subdomains are configured:

1.  **Mail Tracking (`gmb.suryamandir.online`)**:
    -   **Purpose**: Used by Resend to track link clicks and open rates in emails.
    -   **Setup**: In GoDaddy, add a `CNAME` record pointing `gmb` to Resend's tracking domain (provided in Resend Dashboard > Settings > Domains > Tracking).

2.  **Facebook (`facebook.suryamandir.online`)**:
    -   **Purpose**: A memorable link for devotees.
    -   **Setup**: In GoDaddy, use "Forwarding" to point this subdomain to your actual Facebook Page URL.

3.  **YouTube (`youtube.suryamandir.online`)**:
    -   **Purpose**: Direct access to the temple's video channel.
    -   **Setup**: In GoDaddy, use "Forwarding" to point this subdomain to your YouTube Channel URL.

---

## 3. Resend: Email Receiving & Routing
To manage and analyze devotee replies directly in Resend:
1.  **Add Domain**: In Resend Dashboard, go to **Domains** and add `suryamandir.online`.
2.  **Verify DNS**: Add the provided `TXT` and `CNAME` records to your GoDaddy DNS.
3.  **Setup Tracking**: Add the `gmb` subdomain as your "Tracking Domain" in the Resend domain settings.
4.  **Setup Receiving (MX)**: 
    - Go to **Settings > Receiving** in Resend.
    - Add the `MX` records provided by Resend to your GoDaddy DNS.
    - This allows emails sent TO `contact@suryamandir.online` to be routed through Resend.
5.  **Configure Forwarding**: 
    - In Resend, create a "Route".
    - Pattern: `contact@suryamandir.online`
    - Action: Forward to your personal email.

---

## 4. Production reCAPTCHA (IMPORTANT)
To remove the "Simulation" banner from `www.suryamandir.online`:
1.  Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin).
2.  Register a new site.
3.  **reCAPTCHA type**: Select **reCAPTCHA v2 ("I'm not a robot" Checkbox)**.
4.  **Domains**: Add `suryamandir.online` and `mandirsamiti.netlify.app`.
5.  Add the Site Key and Secret Key as Environment Variables in Vercel/Netlify.
6.  **REDEPLOY**: You must redeploy for these keys to take effect.

---

## 5. Firebase Project Setup
1. **Auth**: Enable Email/Password and Google providers.
2. **Rules**: Deploy the provided `firestore.rules`.
3. **Roles**: Manually add your UID to the `roles_admin` collection in Firestore to grant yourself access to the Management Panel.
