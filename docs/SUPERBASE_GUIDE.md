# Superbase Implementation Guide: Mandir Samiti Bahpura

This guide provides a detailed, step-by-step process for using Superbase as the backend for the temple management system. Superbase provides a relational (PostgreSQL) alternative to Firebase.

---

## Step 1: Create Your Superbase Project

1.  Go to [supabase.com](https://supabase.com) and sign in.
2.  Click **New Project** and select your organization.
3.  Enter project details:
    *   **Name:** Mandir Samiti Bahpura
    *   **Database Password:** (Securely store this)
    *   **Region:** Select the one closest to your users (e.g., Mumbai for India).
4.  Wait for the database to provision.

---

## Step 2: Database Schema Setup

Navigate to the **SQL Editor** in your Superbase dashboard and run the following script to create the necessary tables for the Mandir system:

```sql
-- 1. Profiles Table (Extends Superbase Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  role text default 'devotee',
  is_verified boolean default false,
  photo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Admin Roles Registry
create table roles_admin (
  user_id uuid references profiles(id) on delete cascade primary key,
  assigned_at timestamp with time zone default now()
);

-- 3. Notices
create table notices (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  importance text default 'normal',
  created_at timestamp with time zone default now()
);

-- 4. Events
create table events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  event_date timestamp with time zone,
  image_url text,
  created_at timestamp with time zone default now()
);

-- 5. Donations
create table donations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete set null,
  devotee_name text, -- For manual entries
  amount numeric not null,
  mode text,
  status text default 'completed',
  is_manual boolean default false,
  created_at timestamp with time zone default now()
);

-- 6. Prayer Requests
create table prayer_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  request_type text,
  message text,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

-- 7. Seva Programs
create table seva_programs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  icon text
);

-- 8. Admin Activity Logs
create table admin_activity_logs (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references profiles(id),
  admin_name text,
  action_type text,
  entity_type text,
  entity_title text,
  timestamp timestamp with time zone default now()
);
```

---

## Step 3: Authentication Configuration

1.  **Providers:** Go to **Authentication > Providers**.
    *   **Email:** Ensure "Confirm Email" is enabled for production.
    *   **Google:** Follow Superbase docs to add your Google Client ID and Secret from the Google Cloud Console.
2.  **Site URL:** Set your site URL (e.g., `https://mandir-bahpura.vercel.app`) in **Authentication > Configuration**.

---

## Step 4: Storage (Media Gallery)

1.  Go to **Storage** in the Superbase Dashboard.
2.  Create a new bucket named `media`.
3.  Set the bucket to **Public** so devotees can view gallery images without logging in.

---

## Step 5: Next.js Integration

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 2. Environment Variables
Add these to your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Create Client (`src/lib/superbase.ts`)
```typescript
import { createClient } from '@supabase/supabase-js'

const superbaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const superbaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const superbase = createClient(superbaseUrl, superbaseAnonKey)
```

---

## Step 6: Row Level Security (RLS)

Protect your data by enabling RLS on all tables. Example policies:

```sql
-- Enable RLS
alter table notices enable row level security;

-- Public can read notices
create policy "Public can view notices" 
on notices for select 
using (true);

-- Only admins can insert/update/delete
create policy "Admins can manage notices" 
on notices for all 
using (
  auth.uid() in (select user_id from roles_admin)
);
```

---

## Summary of Differences (Firebase vs Superbase)

| Feature | Firebase | Superbase |
| :--- | :--- | :--- |
| **Data Model** | NoSQL Collections | Relational Tables (SQL) |
| **Security** | Security Rules | RLS Policies (SQL) |
| **Realtime** | Enabled by default | Enabled per table |
| **Queries** | `where()`, `orderBy()` | `select()`, `eq()`, `order()` |

By following this guide, you can successfully transition the Mandir Samiti Bahpura project to a powerful PostgreSQL-backed infrastructure.
