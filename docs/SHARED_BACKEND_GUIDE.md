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

## 2. Unified Data Collections
Both the Website and the Mobile App will point to the same Firestore collections:
- `/notices`: Announcements posted on the web will appear on the phone.
- `/events`: Festival schedules updated by admins will sync instantly.
- `/users`: A devotee who signs up on the website can log in to the app.
- `/donations`: All history is aggregated regardless of the device used.

---

## 3. Integration Steps

### For the Mobile Developer:
- **iOS:** Use the `FirebaseFirestore` and `FirebaseAuth` pods/packages. Use the `GoogleService-Info.plist` generated in the console.
- **Android:** Use the Firebase Android SDK with the `google-services.json` file.
- **Logic:** Replicate the "Patronage Tier" logic found in `src/app/dashboard/page.tsx` within the app's code to ensure tier calculations match.

---

## 4. Security Rules (CRITICAL)
Your `firestore.rules` are already configured to be platform-agnostic. They check the **User UID**, not where the request comes from. This means:
- If a user is logged in on the app, they can only see their own `/donations`.
- If an admin is logged in on the app, they can write to `/events`.

---

## 5. Handling CMS Content
Since **Decap CMS** writes to Markdown files in the GitHub repository, the mobile app should fetch this static data via:
1.  **Direct GitHub API**: Fetching the `content/about.md` or `content/settings.json` directly.
2.  **Custom API Route**: Use your existing website's `/api/settings` route as a lightweight endpoint for the mobile app to get global branding.

---

## 6. Push Notifications
To enable notifications on mobile:
1.  Enable **Firebase Cloud Messaging (FCM)** in the console.
2.  In your website's **Management Panel**, you can add a button that triggers a Firebase Function to "Blast Notify" all mobile users when an urgent notice is posted.
