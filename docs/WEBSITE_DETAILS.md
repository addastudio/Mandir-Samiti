# Mandir Bahpura Website Documentation

This document provides a detailed overview of the design, architecture, code structure, and strategy for the Mandir Samiti Bahpura management system and website.

---

## 1. Executive Summary
The Mandir Bahpura website is a modern, responsive, and bilingual (Hindi/English) platform designed to bridge the gap between the temple samiti (committee) and devotees. It provides real-time updates on notices, events, and seva programs while offering a secure portal for donations and prayer requests.

## 2. Technical Architecture
The application is built using a modern full-stack serverless architecture.

- **Frontend Framework:** Next.js 15 (App Router)
- **Programming Language:** TypeScript
- **Styling:** Tailwind CSS with ShadCN UI components
- **Backend-as-a-Service:** Firebase (Google Cloud Platform)
  - **Authentication:** Firebase Auth (Email/Password & Google Sign-In)
  - **Database:** Firestore (NoSQL, Real-time)
  - **Hosting:** Firebase App Hosting
- **Email Service:** Resend (for OTP and contact form alerts)
- **Payment Integration:** Stripe (Simulation mode for prototyping)

### Architecture Highlights:
- **Server Actions:** Used for secure, server-side logic like sending emails.
- **Client Components:** Used for real-time Firestore listeners and interactive UI elements.
- **Context API:** Used for global state management, specifically for the bilingual translation system.

---

## 3. Design Philosophy
The design focuses on "Modern Spirituality"—combining traditional temple aesthetics with professional, clean UI patterns.

- **Color Palette:**
  - **Primary:** Saffron/Gold (`hsl(42 92% 48%)`) representing divinity and energy.
  - **Accent:** Maroon (`hsl(0 100% 27%)`) for headline highlights.
  - **Background:** Warm Cream (`hsl(46 74% 91%)`) to provide a serene, non-stark reading experience.
- **Typography:**
  - **English:** Poppins (Modern, geometric sans-serif).
  - **Hindi:** Mukta (Optimized for Devanagari readability).
- **Responsiveness:** Mobile-first approach using Tailwind's grid and flexbox systems. The Management Panel features a touch-optimized horizontal tab system for administration on the go.

---

## 4. Strategy & Features

### A. Bilingual Engagement (i18n)
The site detects the user's preferred language and stores it in local storage. All content, from the home page to the dashboard, is mapped through a robust translation object system in `src/lib/translations.ts`.

### B. Role-Based Access Control (RBAC)
Security is enforced at the database level using **Firestore Security Rules**.
- **Devotees:** Can read public info and manage their own donations/requests.
- **Admins:** Defined in a specific `roles_admin` collection. They have full "Write" access to events, gallery, and notices.
- **Hierarchy:** Roles like `President` and `Secretary` have higher power levels within the management UI.

### C. Data Mutation Strategy
The app employs a **Non-Blocking Update Pattern**.
- Mutations (like adding an event) are initiated immediately.
- The UI updates optimistically.
- Error handling is centralized via a global `errorEmitter` that surfaces contextual Security Rules errors to developers/admins without crashing the app for the user.

---

## 5. Code Structure Overview

- `/src/app`: Contains the Next.js App Router pages and layouts.
- `/src/components`:
  - `/sections`: Modular home page sections (Hero, About, Events).
  - `/ui`: Low-level ShadCN UI components.
  - `/layout`: Global components like Header, Footer, and Breadcrumbs.
- `/src/firebase`:
  - `config.ts`: Firebase client configuration.
  - `provider.tsx`: React Context for Firebase services.
  - `use-collection.tsx` & `use-doc.tsx`: Custom hooks for real-time Firestore data binding.
- `/src/ai`: Integration with Genkit for future AI-powered features (e.g., automated event description generation).

---

## 6. Security & Stability
- **Environment Variables:** Sensitive keys (Stripe, Resend) are managed via `.env` and `apphosting.yaml`.
- **Input Validation:** Zod schemas are used to validate forms both on the client and server.
- **Audit Trail:** Every administrative action is logged in the `admin_activity_logs` collection, tracking the "Who, What, and When" of every change.

---

## 7. Future Roadmap
- **Live Streaming Integration:** Seamless embedding of YouTube/Facebook live Aarti streams.
- **Automated Reminders:** SMS/Email notifications for upcoming festivals based on user preferences.
- **Inventory Management:** Adding a section for managing temple assets and samiti inventory.
