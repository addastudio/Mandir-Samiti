# Mandir Bahpura - Mobile App Building Guide

This project is already equipped to provide a professional mobile experience for your devotees. You do not need to switch workspaces or create a separate project.

## 1. The Strategy: Mobile-First Web App (PWA)
Instead of building a separate complex Android app from scratch, we use this current project as a **Progressive Web App (PWA)**. 
- **Shared Backend:** It uses the same Firebase Auth and Firestore you just registered in the console.
- **One-Tap Install:** Devotees can click "Add to Home Screen" on their Android or iPhone, and it will appear as an app with its own icon.

## 2. Connecting your "Android App" from Firebase Console
The "Android Package Name" (`org.mandirbahpura.app`) you registered is a **Container** for your data. 
- **Web App:** Uses the `firebaseConfig` found in `src/firebase/config.ts`.
- **Android App:** When you eventually build a native app, it will use the `google-services.json` you saw in the console.
- **Result:** Whether a user donates on the website or the future Android app, the data goes to the **same Firestore database**.

## 3. How to build the "Mobile Experience" here:
1. **Responsive UI:** We have already added strict layout constraints to the `Header` and `Footer` to ensure they never overlap on mobile.
2. **Mobile Nav:** The `Header.tsx` uses a "Sheet" (Hamburger menu) specifically for small screens.
3. **App Icons:** To make it look like a real app, upload a high-resolution logo to your CMS (`/admin`) and it will automatically update the site favicon and mobile icons.

## 4. Professional Native Build (Advanced)
If you require a native `.apk` for the Google Play Store:
- Use **CapacitorJS**. It allows you to wrap this exact Next.js project into a native Android container.
- You will then use the `google-services.json` file you saw in the Firebase Console.

---
**Summary:** Stay in this workspace. Your web app IS your mobile app prototype. All data is already synced across all platforms via your Firebase project.