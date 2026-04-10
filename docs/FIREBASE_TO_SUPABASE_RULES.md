# Security Migration: Firebase Rules to Supabase RLS

This guide explains how to translate the **Mandir Samiti Bahpura** security model from Firebase Security Rules to Supabase Row-Level Security (RLS).

---

## 1. Core Conceptual Differences

| Feature | Firebase Security Rules | Supabase RLS (PostgreSQL) |
| :--- | :--- | :--- |
| **Logic Type** | Path-based, JSON-like logic | SQL-based `USING` and `WITH CHECK` clauses |
| **User Identity** | `request.auth.uid` | `auth.uid()` |
| **Data Access** | `resource.data` | Column names directly |
| **Admin Check** | `exists(/databases/$(db)/documents/roles_admin/$(uid))` | `EXISTS (SELECT 1 FROM roles_admin WHERE user_id = auth.uid())` |

---

## 2. Global Admin Logic

In Firebase, we used a helper function. In Supabase, we can create a PostgreSQL function for reuse across all policies.

### SQL Setup (Run this first)
```sql
-- Function to check if the current user is an admin
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from roles_admin 
    where user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;
```

---

## 3. Collection Mapping

### A. Events & Notices (Public Read, Admin Write)

**Firebase:**
```javascript
match /events/{eventId} {
  allow get, list: if true;
  allow create, update, delete: if isAdmin();
}
```

**Supabase RLS:**
```sql
-- Enable RLS
alter table events enable row level security;

-- Policy: Public Read
create policy "Allow public read access"
on events for select
using (true);

-- Policy: Admin Write
create policy "Allow admin full access"
on events for all
using (is_admin());
```

### B. Prayer Requests (Public Create, Owner/Admin Read)

**Firebase:**
```javascript
match /prayer_requests/{requestId} {
  allow create: if true;
  allow get, list: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
}
```

**Supabase RLS:**
```sql
alter table prayer_requests enable row level security;

-- Anyone can submit
create policy "Allow public submission"
on prayer_requests for insert
with check (true);

-- Only owner or admin can view
create policy "Allow owner or admin to view"
on prayer_requests for select
using (auth.uid() = user_id or is_admin());
```

### C. User Donations (Owner/Admin Only)

**Firebase:**
```javascript
match /users/{userId}/donations/{donationId} {
  allow read, write: if (isSignedIn() && request.auth.uid == userId) || isAdmin();
}
```

**Supabase RLS:**
```sql
alter table donations enable row level security;

-- View/Manage own records
create policy "Manage own donations"
on donations for all
using (auth.uid() = user_id or is_admin());
```

---

## 4. Key Security Tips for Supabase

1.  **Select vs All:** Use `for select`, `for insert`, `for update`, or `for delete` for granular control. Using `for all` is like Firebase's `allow read, write`.
2.  **Service Role:** The `service_role` key bypasses RLS. Use this only in secure server-side environments (like Next.js Server Actions), never in the browser.
3.  **Performance:** SQL `exists` checks are very fast in PostgreSQL, but ensure you have an index on `roles_admin(user_id)`.
4.  **Testing:** Use the "Policy Editor" in the Supabase Dashboard to test policies against specific users without writing code.
