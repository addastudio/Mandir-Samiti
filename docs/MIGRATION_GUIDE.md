# Mandir Bahpura - Migration & Deployment Guide

This guide outlines the process for migrating this project from the development environment to a production-ready setup using GitHub and Firebase.

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
   git commit -m "Initial commit: Mandir Bahpura Website"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

---

## 2. Firebase Project Setup

1. **Go to Firebase Console:** Visit [console.firebase.google.com](https://console.firebase.google.com).
2. **Create Project:** Click "Add project" and follow the setup wizard.
3. **Provision Services:**
   - **Firestore:** Enable "Cloud Firestore" in production mode. Choose a location close to your users (e.g., `asia-south1` for India).
   - **Authentication:** Enable "Email/Password" and "Google" sign-in providers.
   - **App Hosting:** This is the service used to host Next.js apps.

---

## 3. Database & Security Rules

1. **Deploy Rules:** Copy the content of `firestore.rules` from this project and paste it into the "Rules" tab of your Firestore dashboard in the Firebase Console. Click **Publish**.
2. **Indexes:** If your dashboard shows errors about missing indexes when filtering donations or requests, follow the provided links in the console to create them automatically.

---

## 4. Production Hosting (Firebase App Hosting)

Firebase App Hosting is designed specifically for Next.js 13+ App Router projects.

1. **Connect to GitHub:**
   - In the Firebase Console, go to **App Hosting**.
   - Click **Get started** and connect your GitHub account.
   - Select the repository you created in Step 1.
2. **Configure Build Settings:**
   - App Hosting will automatically detect Next.js.
   - It will use the `apphosting.yaml` file already present in your root directory.
3. **Environment Variables:**
   In the App Hosting dashboard for your backend, add the following secrets/variables:
   - `STRIPE_SECRET_KEY`: Your live secret key from Stripe.
   - `RESEND_API_KEY`: Your API key from Resend for emails.
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: (Optional) If needed for client-side logic.

---

## 5. Third-Party Integrations

### A. Stripe (Payments)
1. Go to the [Stripe Dashboard](https://dashboard.stripe.com).
2. Switch to **Live Mode** (or stay in Test Mode for final staging).
3. Copy your **Secret Key** and add it to Firebase App Hosting environment variables.
4. Ensure your **Success** and **Cancel** URLs in `src/app/actions.ts` match your production domain.

### B. Resend (Emails)
1. Sign up at [Resend.com](https://resend.com).
2. Verify your domain (e.g., `mandirbahpura.org`).
3. Generate an API Key and add it to Firebase App Hosting.

---

## 6. Custom Domain

1. In the **App Hosting** dashboard, go to the "Settings" or "Domains" tab.
2. Click **Connect domain** and follow the instructions to update your DNS records (A and TXT records) with your domain provider (like GoDaddy or Namecheap).

---

## 7. Ongoing Maintenance

- **Updates:** Every time you `git push` to the `main` branch, Firebase App Hosting will automatically trigger a new build and deploy your changes.
- **Backups:** Regularly export your Firestore data using the Google Cloud Console.
- **Logs:** Use the "Logs" tab in App Hosting to debug any server-side issues.
