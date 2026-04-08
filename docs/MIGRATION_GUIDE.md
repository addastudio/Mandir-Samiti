# Mandir Bahpura - Migration & Deployment Guide

This guide outlines the process for migrating this project from the development environment to a production-ready setup using GitHub and Vercel/Firebase.

---

## 1. Source Control (GitHub Setup)

1. **Initialize Git:**
   If not already initialized, run:
   ```bash
   git init
   ```
2. **Create Repository:** Create a new private or public repository on [GitHub](https://github.com).
3. **Push Code:**
   ```bash
   git add .
   ```

---

## 2. Firebase Project Setup

1. **Go to Firebase Console:** Visit [console.firebase.google.com](https://console.firebase.google.com).
2. **Create Project:** Click "Add project" and follow the setup wizard.
3. **Provision Services:**
   - **Firestore:** Enable "Cloud Firestore" in production mode.
   - **Authentication:** Enable "Email/Password" and "Google" sign-in providers.

---

## 3. Production Hosting (Vercel Recommendation)

For zero-cost hosting of Next.js apps, **Vercel** is highly recommended.

1. **Connect to GitHub:**
   - In the Vercel Dashboard, click **Add New** > **Project**.
   - Import your GitHub repository.
2. **Configure Environment Variables:**
   Add the following secrets in the Vercel Dashboard:
   
   **Mandatory:**
   - `STRIPE_SECRET_KEY`: Your live secret key from Stripe.
   - `CASHFREE_APP_ID`: Your Cashfree App ID.
   - `CASHFREE_SECRET_KEY`: Your Cashfree Secret Key.
   - `NEXT_PUBLIC_CASHFREE_MODE`: `sandbox` (testing) or `production`.
   
   **Optional:**
   - `RESEND_API_KEY`: Your API key from Resend for emails.

---

## 4. Payment Gateway Selection

The app supports multiple payment gateways. It will automatically detect which one to use based on your API keys:

- **Stripe:** Best for international card payments.
- **Cashfree:** Best for Indian local payments (UPI, QR, Netbanking).

If you provide keys for both, the user will be given a choice on the donation page.

---

## 5. Ongoing Maintenance

- **Updates:** Every time you `git push` to the `main` branch, Vercel will automatically trigger a new build and deploy your changes.
- **Backups:** Regularly export your Firestore data using the Google Cloud Console.
