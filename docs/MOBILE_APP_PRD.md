# Product Requirements Document (PRD): Mandir Samiti Mobile App

## 1. Project Overview
**Project Name:** Mandir Samiti Bahpura Mobile
**Platforms:** iOS and Android
**Objective:** To provide a seamless, high-performance mobile experience for devotees to stay connected with the temple, receive real-time updates, and make contributions.

---

## 2. Target Audience
- **Devotees:** Regular visitors looking for event updates, daily Aarti timings, and a way to submit prayer requests.
- **Donors:** Supporters who want a quick, one-tap method to contribute and track their patronage status.
- **Committee Members:** Administrators who need to manage the temple on the go.

---

## 3. Key Features

### MVP (Phase 1)
- **Unified Authentication:** Login using the same credentials as the website (Email/Password or Google).
- **Live Feed:** A home screen showing current notices (urgent/normal) and upcoming events.
- **Digital Darshan:** High-quality gallery and integrated YouTube player for Live Aarti.
- **One-Tap Donations:** Integrated Stripe and Cashfree mobile SDKs for seamless giving.
- **Prayer Portal:** Mobile-optimized form for submitting ritual and prayer requests.
- **Devotee Profile:** Track total contributions, download receipts, and view Patronage Tiers (Supporter to Grand Patron).

### Phase 2 (Enhancements)
- **Push Notifications:** Instant alerts for festival announcements or urgent community notices.
- **Offline Mode:** Basic access to temple history and contact details without internet.
- **QR Scanner:** In-app scanner to read temple-placed QR codes for instant donation forms.
- **Bilingual Toggle:** In-app switch between Hindi and English (persisted across sessions).

---

## 4. Technical Architecture
- **Backend:** Shared Firebase (Firestore, Auth, Storage).
- **AI Integration:** Shared Genkit flows for automated content summaries.
- **State Management:** Local persistence to ensure fast loading on mobile networks.
- **Security:** Shared Firestore Security Rules to ensure consistent data protection across platforms.

---

## 5. UI/UX Design Principles
- **Modern Spirituality:** Clean, white-space heavy design with Saffron/Gold accents.
- **Accessibility:** Large touch targets, high-contrast text for elderly devotees, and full Hindi support.
- **Performance:** Smooth transitions and lazy-loading for heavy gallery images.

---

## 6. Success Metrics
- **Retention:** Number of weekly active users (WAU) checking the Notice Board.
- **Conversion:** Increase in small-ticket donations due to mobile ease-of-use.
- **Engagement:** Number of prayer requests submitted via the mobile app vs. the website.
