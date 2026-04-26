# Mandir Samiti Bahpura - Technical Specification

This document provides a complete overview of the application architecture, design philosophy, data flows, and logical structures.

---

## 1. System Architecture
The application follows a **Serverless Full-Stack Architecture** using Next.js 15 and Firebase.

- **Frontend:** Next.js (App Router), React, Tailwind CSS, ShadCN UI.
- **Backend-as-a-Service (BaaS):** Firebase (Auth, Firestore).
- **Dual Backend Support:** Optional Superbase (Supabase) integration for migration flexibility.
- **Payment Layer:** Stripe (International) & Cashfree (Domestic India).
- **Email Layer:** Resend (Transactional OTP & Notifications).
- **AI Layer:** Genkit (Gemini 2.5 Flash) for automated content generation in the Admin Panel.
- **CMS Layer:** Contentful (Headless CMS) for core static content management.

---

## 2. Design Philosophy
The design focuses on "Modern Spirituality"—combining traditional temple aesthetics with professional, clean UI patterns.

- **Color Palette:**
  - **Primary:** Saffron/Gold (`hsl(42 92% 48%)`) representing divinity.
  - **Accent:** Maroon (`hsl(0 100% 27%)`) for headline highlights.
  - **Background:** Warm Cream (`hsl(46 74% 91%)`) for a serene reading experience.
- **Typography:**
  - **English:** Poppins (Modern, geometric sans-serif).
  - **Hindi:** Mukta (Optimized for Devanagari readability).
- **Responsiveness:** Mobile-first approach using dynamic viewport heights (`dvh`) and flexible grid systems.

---

## 3. Database Schema (Firestore)

### Collection: `users`
- `id`: string (UID)
- `name`: string
- `email`: string
- `role`: enum ("devotee", "member", "official", "president")
- `isVerified`: boolean
- `photoURL`: string

### Collection: `donations` (Sub-collection of user & Top-level)
- `amount`: number
- `date`: ISO Timestamp
- `mode`: string ("Stripe", "Cash", "UPI")
- `status`: string ("completed", "failed")
- `devoteeName`: string (for manual entries)

### Collection: `roles_admin`
- `id`: string (User UID)
- `assignedAt`: ISO Timestamp
- *Note: Presence here grants full system write access.*

---

## 4. Core Logic & Pseudocode

### A. Patronage Tier Logic
```javascript
FUNCTION getTierInfo(totalDonatedAmount):
    IF amount >= 100,000 THEN RETURN "Grand Patron"
    ELSE IF amount >= 10,000 THEN RETURN "Guardian"
    ELSE IF amount >= 5,000 THEN RETURN "Patron"
    ELSE IF amount >= 1,000 THEN RETURN "Pillar"
    ELSE RETURN "Supporter"
END FUNCTION
```

### B. Security Model (RBAC)
Security is enforced via **Firestore Security Rules**:
1. **Public Read:** `events`, `gallery`, `notices`, `mandir_samiti_members`.
2. **Private Access:** `donations` and `prayer_requests` (Owner or Admin only).
3. **Admin Write:** Any modification to public collections requires entry in `roles_admin`.

---

## 5. Deployment Guidelines
The site is optimized for **Netlify** or **Firebase App Hosting**. 
1. **Netlify:** Use the official Next.js Runtime (automatic).
2. **Security:** Netlify provides managed SSL and secure environment variable handling.
3. **Connectivity:** Firestore is configured to use Long Polling to avoid issues with restrictive corporate/ISP proxies on the edge.

