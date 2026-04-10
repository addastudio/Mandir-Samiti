# Superbase Alternative Backend Plan: Mandir Samiti Bahpura

This document outlines how to use **Superbase** as an alternative to Firebase for the temple website's backend services. Superbase is an open-source Firebase alternative based on PostgreSQL.

---

## 1. Why Superbase?
- **Relational Database:** PostgreSQL is excellent for structured data like donations and member records.
- **Generous Free Tier:** 
  - 500MB Database size (plenty for thousands of records).
  - 5GB Bandwidth.
  - 1GB Storage.
  - Unlimited Authentication users.
- **SQL Power:** Easier reporting for samiti accounts (e.g., "Total donations by month").

---

## 2. Infrastructure Setup

### A. Database (PostgreSQL)
Instead of Firestore's NoSQL collections, you would create relational tables.
- `users`: id (uuid), name, email, role, is_verified.
- `notices`: id, title, content, importance, created_at.
- `events`: id, title, description, date, image_url.
- `donations`: id, user_id, amount, date, status, mode.
- `prayer_requests`: id, name, email, phone, message, status, created_at.

### B. Authentication
- Enable **Email/Password** and **Google** providers in the Superbase Dashboard under "Authentication".
- Set the site URL to your Vercel or Production domain.

### C. Storage
- Create a public bucket named `media`.
- Use this for gallery images and event thumbnails.

---

## 3. Migration Roadmap

### Step 1: Install Dependencies
You would need to swap the Firebase SDK for the Superbase client:
```bash
npm install @supabase/supabase-js
```

### Step 2: Connection
Create a `src/lib/superbase.ts` file using your Project URL and Anon Key:
```typescript
import { createClient } from '@supabase/supabase-js'

const superbaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const superbaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const superbase = createClient(superbaseUrl, superbaseAnonKey)
```

### Step 3: Security (RLS)
Superbase uses **Row Level Security (RLS)** instead of Firestore Rules. You would write SQL policies:
```sql
-- Example: Allow anyone to read notices
create policy "Public can view notices" 
on notices for select 
using (true);

-- Example: Only admins can create events
create policy "Admins can manage events" 
on events for all 
using ( auth.uid() in (select user_id from user_roles where role = 'admin') );
```

---

## 4. Feature Comparison (Free Tiers)

| Feature | Firebase (Spark) | Superbase (Free) |
| :--- | :--- | :--- |
| **Database** | 1GB Total / 50k reads/day | 500MB PostgreSQL |
| **Auth** | Unlimited (Email/Google) | Unlimited Users |
| **Storage** | 5GB | 1GB |
| **Edge Functions**| Google Cloud Functions (Paid) | Included (Limited) |
| **Realtime** | Native Firestore | Supported via Postgres |

---

## 5. Summary
Superbase is a "Pro" choice if the Samiti needs complex data relationships and SQL reporting in the future. For simple real-time updates and low-latency global access, **Firebase** remains the easiest to maintain for non-developers.

**To save as PDF:** Press **Ctrl+P** while viewing this file.
