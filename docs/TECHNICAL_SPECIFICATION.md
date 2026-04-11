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
- **AI Layer:** Genkit (Gemini 2.5 Flash) for automated content generation.

---

## 2. Design Philosophy
The design focuses on "Modern Spirituality"—combining traditional temple aesthetics with professional, clean UI patterns.

- **Color Palette:**
  - **Primary:** Saffron/Gold (`hsl(42 92% 48%)`) representing divinity and energy.
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
- `date`: timestamp
- `mode`: string ("Stripe", "Cash", "UPI")
- `status`: string ("completed", "failed")
- `devoteeName`: string (for manual entries)

### Collection: `roles_admin`
- `id`: string (User UID)
- `assignedAt`: timestamp
- *Note: Presence here grants full system write access.*

---

## 4. Core Logic & Pseudocode

### A. Patronage Tier Logic
```javascript
FUNCTION getTierInfo(totalDonatedAmount):
    IF amount >= 100,000 THEN RETURN "Grand Patron" (Theme: Indigo + Glow)
    ELSE IF amount >= 10,000 THEN RETURN "Guardian" (Theme: Emerald)
    ELSE IF amount >= 5,000 THEN RETURN "Patron" (Theme: Saffron)
    ELSE IF amount >= 1,000 THEN RETURN "Pillar" (Theme: Amber)
    ELSE RETURN "Supporter" (Theme: Minimal)
END FUNCTION
```

### B. Security Model (RBAC)
Security is enforced via **Firestore Security Rules**:
1. **Public Read:** `events`, `gallery`, `notices`, `mandir_samiti_members`.
2. **Private Read:** `donations` and `prayer_requests` (Owner/Admin only).
3. **Admin Write:** Any modification to public collections requires entry in `roles_admin`.

---

## 5. Code Structure Overview
- `/src/app`: Next.js App Router pages.
- `/src/components/sections`: Modular home page sections.
- `/src/firebase`: Core Firebase configuration and real-time hooks.
- `/src/ai`: Genkit flows for AI-powered content generation.
- `/src/lib/translations.ts`: Master bilingual dictionary.
