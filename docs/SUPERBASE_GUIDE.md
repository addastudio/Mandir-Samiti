# Superbase Implementation Guide: Mandir Samiti Bahpura

This guide provides a comprehensive, step-by-step roadmap for using **Superbase** (Supabase) as the backend for the temple management system.

---

## 1. Project Initialization
1.  **Create Project**: Go to [database.new](https://database.new) and create a new project named "Mandir Bahpura".
2.  **API Keys**: Copy your `Project URL` and `anon public` key from the Settings > API tab.
3.  **Environment Variables**: Add these to your `.env` file:
    ```bash
    NEXT_PUBLIC_SUPERBASE_URL=your_project_url
    NEXT_PUBLIC_SUPERBASE_ANON_KEY=your_anon_key
    ```

---

## 2. Database Schema (SQL)

Run the following script in the Superbase SQL Editor to create the core tables and relationships:

```sql
-- 1. Profiles & RBAC
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text unique not null,
  role text default 'devotee',
  is_verified boolean default false,
  photo_url text,
  created_at timestamp with time zone default now()
);

-- Registry for Admin UIDs (mirrors roles_admin in Firestore)
create table roles_admin (
  user_id uuid references profiles(id) on delete cascade primary key,
  assigned_at timestamp with time zone default now()
);

-- 2. Content Management
create table notices (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  importance text default 'normal', -- 'normal' or 'urgent'
  created_at timestamp with time zone default now()
);

create table events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  event_date timestamp with time zone not null,
  image_url text,
  created_at timestamp with time zone default now()
);

create table gallery (
  id uuid default gen_random_uuid() primary key,
  caption text,
  media_url text not null,
  media_type text default 'image', -- 'image' or 'video'
  created_at timestamp with time zone default now()
);

-- 3. Community & Contributions
create table donations (
  id uuid default gen_random_uuid() primary key,
  amount numeric not null,
  mode text not null, -- 'Stripe', 'Cash', 'UPI'
  status text default 'completed',
  user_id uuid references profiles(id) on delete set null,
  devotee_name text, -- For manual entries
  created_at timestamp with time zone default now()
);

create table prayer_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  request_type text not null,
  message text not null,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

-- 4. Audit Logs
create table admin_activity_logs (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references profiles(id),
  admin_name text,
  action_type text not null,
  entity_type text,
  entity_title text,
  timestamp timestamp with time zone default now()
);
```

---

## 3. Row-Level Security (RLS) Policies

Enable RLS on all tables. Use these policies to match the security logic of the temple:

### Global Admin Function
```sql
create or replace function is_admin()
returns boolean as $$
begin
  return exists (select 1 from roles_admin where user_id = auth.uid());
end;
$$ language plpgsql security definer;
```

### Table Policies
| Table | Read Access | Write Access (Insert/Update/Delete) |
| :--- | :--- | :--- |
| `profiles` | `auth.uid() = id` | `auth.uid() = id` or `is_admin()` |
| `notices` | `true` (Public) | `is_admin()` |
| `events` | `true` (Public) | `is_admin()` |
| `gallery` | `true` (Public) | `is_admin()` |
| `donations` | `auth.uid() = user_id` or `is_admin()` | `is_admin()` (Manual) or Internal Service |
| `prayer_requests` | `auth.uid() = user_id` or `is_admin()` | `true` (Insert Only for Public) |

---

## 4. Integration Logic
The app automatically detects Superbase keys via `src/lib/superbase.ts`. To use Superbase for data fetching, you can update your hooks to conditionally use the `superbase` client when available.

```typescript
import { superbase } from '@/lib/superbase';

async function fetchNotices() {
  if (superbase) {
    const { data } = await superbase.from('notices').select('*').order('created_at', { ascending: false });
    return data;
  }
  // Fallback to Firestore...
}
```