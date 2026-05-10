# Shared Backend Guide: Connecting Web & Mobile

This guide explains how to ensure your iOS/Android app and your Next.js website use the **exact same data source**.

---

## 1. The Single Source of Truth
The "Mandir Samiti Bahpura" project is built on **Firebase**. Firebase is designed to be a cross-platform backend. To share data:
1.  **Do NOT create a new Firebase project.**
2.  Go to your existing [Firebase Console](https://console.firebase.google.com/).
3.  Click **"Add App"** and select **iOS** or **Android**.
4.  Register the apps within the **same Project ID** as your website.

---

## 2. Choosing your Android Package Name
When prompted by Firebase for an "Android package name", use the reverse-domain convention:
- **Recommended Package Name:** `org.mandirbahpura.app`
- **Why?** This is based on your domain `mandirbahpura.org`. It must be unique across all apps on the Google Play Store.

---

## 3. Integration Steps

### For the Mobile Developer:
- **iOS:** Use the `FirebaseFirestore` and `FirebaseAuth` pods/packages. Use the `GoogleService-Info.plist` generated in the console.
- **Android:** Use the Firebase Android SDK with the `google-services.json` file.
- **Unified Logic:** Both platforms will point to the same Firestore collections:
  - `/notices`: Announcements posted on the web will appear on the phone.
  - `/events`: Festival schedules updated by admins will sync instantly.
  - `/users`: A devotee who signs up on the website can log in to the app.

---

## 4. Security Rules (CRITICAL)
Your `firestore.rules` are already configured to be platform-agnostic. They check the **User UID**, not where the request comes from. This means if a user is logged in on the app, they can see their own donations just like on the website.
