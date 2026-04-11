# Superbase Implementation Guide: Mandir Samiti Bahpura

This guide provides a detailed roadmap for using **Superbase** (Supabase) as an alternative backend for the temple management system.

---

## 1. Why Superbase?
- **Relational Power:** PostgreSQL is excellent for structured data like donations and reporting.
- **Generous Free Tier:** 500MB Database, 5GB Bandwidth, and unlimited Auth users.
- **SQL Reporting:** Easier to generate financial summaries for samiti accounts.

---

## 2. Infrastructure Setup (SQL Editor)

Run this script in your Superbase dashboard to create the core tables:

```sql
-- Profiles Table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  role text default 'devotee',
  is_verified boolean default false,
  created_at timestamp with time zone default now()
);

-- Admin Registry
create table roles_admin (
  user_id uuid references profiles(id) on delete cascade primary key,
  assigned_at timestamp with time zone default now()
);

-- Core Collections
create table notices ( id uuid primary key, title text, content text, importance text, created_at timestamp );
create table events ( id uuid primary key, title text, description text, event_date timestamp, image_url text );
create table donations ( id uuid primary key, amount numeric, mode text, status text, user_id uuid references profiles(id) );
```

---

## 3. Security Migration: Firebase Rules to Superbase RLS

| Firebase Rule | Superbase RLS (SQL) |
| :--- | :--- |
| `allow get: if true` | `create policy "Public Read" on table for select using (true);` |
| `allow write: if isAdmin()` | `create policy "Admin Write" on table for all using (is_admin());` |
| `resource.data.userId == auth.uid` | `auth.uid() = user_id` |

### Global Admin Check (PostgreSQL Function)
```sql
create or replace function is_admin()
returns boolean as $$
begin
  return exists (select 1 from roles_admin where user_id = auth.uid());
end;
$$ language plpgsql security definer;
```

---

## 4. Environment Configuration
The system automatically detects Superbase if these keys are present:
- `NEXT_PUBLIC_SUPERBASE_URL`: Your project API URL.
- `NEXT_PUBLIC_SUPERBASE_ANON_KEY`: Your project Public "anon" key.

Check the **Admin Panel > Settings** to verify connectivity.
