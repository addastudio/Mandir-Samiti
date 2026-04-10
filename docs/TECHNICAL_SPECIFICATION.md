# Mandir Samiti Bahpura - Technical Specification

This document provides a complete overview of the application architecture, data flows, and logical structures.

---

## 1. System Architecture
The application follows a **Serverless Full-Stack Architecture** using Next.js 15 and Firebase.

- **Frontend:** Next.js (App Router), React, Tailwind CSS, ShadCN UI.
- **Backend-as-a-Service (BaaS):** Firebase (Auth, Firestore).
- **Payment Layer:** Stripe (International) & Cashfree (Domestic India).
- **Email Layer:** Resend (Transactional OTP & Notifications).
- **AI Layer:** Genkit (Gemini 2.5 Flash) for automated content generation.

---

## 2. Core Flowcharts (Logical Logic)

### A. Authentication & Verification Flow
```text
[User Input Email/Pass] -> [Trigger Server Action] -> [Generate 6-digit OTP]
      |                                                     |
      V                                                     V
[Show OTP Screen] <------------------------------- [Send Email via Resend]
      |
      +--> [Valid OTP?] --NO--> [Show Error]
      |
      +--YES--> [Firebase: createUserWithEmailAndPassword]
                  |
                  V
            [Create Firestore User Doc (isVerified: true)] -> [Redirect Dashboard]
```

### B. Donation Processing Flow
```text
[User selects Amount] -> [Choose Gateway: Stripe/Cashfree]
      |
      +--> [IF STRIPE] -> [Server Action: createCheckoutSession] -> [Redirect Stripe URL]
      |                                                                    |
      |                                                                    V
      |                                                           [On Success: Webhook/Callback]
      |                                                                    |
      +--> [IF CASHFREE] -> [Server Action: createOrder] -> [SDK: Open Overlay] -> [Pay]
                                                                           |
                                                                           V
                                                               [Update Firestore: donations]
```

---

## 3. Database Schema (Firestore)

### Collection: `users`
- `id`: string (UID)
- `name`: string
- `email`: string
- `role`: enum ("devotee", "member", "official", "president")
- `isVerified`: boolean
- `photoURL`: string (default: standard-avatar)

### Collection: `donations` (Sub-collection of user)
- `amount`: number
- `date`: timestamp
- `mode`: string ("Stripe", "UPI", "Direct")
- `status`: string ("completed", "failed")

### Collection: `roles_admin`
- `id`: string (User UID)
- `assignedAt`: timestamp
- *Note: Presence here grants full system write access.*

---

## 4. Pseudocode

### A. Patronage Tier Logic (Frontend)
```javascript
FUNCTION getTierInfo(totalDonatedAmount):
    IF amount >= 100,000 THEN RETURN "Grand Patron" (Theme: Indigo + Glow)
    ELSE IF amount >= 10,000 THEN RETURN "Guardian" (Theme: Emerald)
    ELSE IF amount >= 5,000 THEN RETURN "Patron" (Theme: Saffron)
    ELSE IF amount >= 1,000 THEN RETURN "Pillar" (Theme: Amber)
    ELSE RETURN "Supporter" (Theme: Minimal)
END FUNCTION
```

### B. Admin AI Content Generator (Server-side)
```typescript
FUNCTION generateTempleContent(topic, type, lang):
    PROMPT = "You are a professional Mandir Admin. Write a respectful [type] about [topic] in [lang]."
    RESULT = CALL Genkit.generate(PROMPT)
    RETURN {
        title: RESULT.extractedTitle,
        content: RESULT.extractedBody
    }
END FUNCTION
```

---

## 5. Security Model (RBAC)
Security is enforced via **Firestore Security Rules**:

1. **Read Public:** `events`, `gallery`, `notices`, `mandir_samiti_members` are readable by anyone.
2. **Read Private:** `donations` and `prayer_requests` are restricted where `auth.uid == resource.data.userId`.
3. **Write Admin:** Any `write`, `create`, `delete` operation on public collections requires `exists(/databases/$(db)/documents/roles_admin/$(request.auth.uid))`.

---

## 6. How to Convert to PDF
1. Open this file in **VS Code** or a **Markdown Editor**.
2. Press `Ctrl + Shift + P` and type **"Markdown: Open Preview to the Side"**.
3. Right-click the preview and select **"Export to PDF"** (if extension installed) OR open the URL in Chrome and use **Print (Ctrl+P) > Save as PDF**.
