# Mandir Samiti Bahpura - Project Roadmap

This document outlines the development lifecycle and the current "Golden State" of the application.

---

## ✅ Phase 1: UI/UX & Core Design
- **Main Website**: Professional, bilingual (Hindi/English) landing page with smooth section navigation.
- **Management Panel**: Advanced administrative command center with role-based visibility.
- **User Dashboard**: Personal profile management for devotees, featuring donation history and patronage tiers.
- **ShadCN Integration**: Professional UI components with a custom Saffron/Maroon theme.

## ✅ Phase 2: Database & Security
- **Firebase Firestore**: Scalable NoSQL database with strict Collection/Document level security rules.
- **RBAC (Role Based Access Control)**: Tiered permissions (Devotee, Member, Official, President).
- **Security Logic**: Mandatory re-authentication (password check) for sensitive administrative changes.
- **Audit Logging**: Comprehensive system logs for every administrative action.

## ✅ Phase 3: CMS & Content
- **Decap CMS**: Local JSON-based content management for Hero, About, and Seva sections.
- **Contentful Support**: Optional headless CMS integration for dynamic remote content.
- **Bilingual Translation Engine**: High-fidelity translation system supporting Devanagari script.

## ✅ Phase 4: Deployment & Optimization
- **Hosting**: Pre-configured for Vercel and Netlify with optimized build settings.
- **Performance**: Dynamic section loading, image optimization, and SSR-safe Firebase initialization.

## 🚀 Ongoing: Phase 5 - API & Live Integration
- [x] **API Status Dashboard**: Real-time monitoring of integrated services (Stripe, Cashfree, Resend).
- [x] **Live Darshan Control**: In-app management of the YouTube Live Aarti URL.
- [ ] **Webhook Integration**: Real-time payment verification handlers.

## 🤖 Ongoing: Phase 6 - AI Integration (Genkit)
- [x] **AI Content Drafter**: Integrated "Wand" tool for generating Event and Notice descriptions.
- [ ] **AI Chatbot**: Devotee assistant for temple information and ritual guidance.
- [ ] **Smart Summaries**: Automated AI summaries for historical records.

## 📱 Ongoing: Phase 7 - Mobile Application
- [x] **Capacitor Integration**: Core setup for Android and iOS builds.
- [ ] **Native Features**: Push notifications for urgent notices.
- [ ] **PWA Support**: Offline caching for temple timings and contact info.

---

### 🛡️ The Golden State Policy
1. **Preservation**: No existing features (Auth, RBAC, Logs, Tiers) shall be removed without explicit user consent.
2. **Additive Development**: New features must integrate with existing security models (e.g., Logging, Re-auth).
3. **Stability**: Initialization singletons and SSR guards must be maintained to prevent SDK assertion errors.
