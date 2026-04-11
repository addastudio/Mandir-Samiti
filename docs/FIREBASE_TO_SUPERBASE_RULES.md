# Security Rules: Firebase to Superbase Migration

This document compares **Firestore Security Rules** with **Supabase Row-Level Security (RLS)** to help you translate your protection logic.

---

## 1. Core Logic Comparison

### Admin Access
**Firebase (Firestore Rules)**
```javascript
function isAdmin() {
  return request.auth != null && exists(/databases/$(database)/documents/roles_admin/$(request.auth.uid));
}
match /events/{eventId} {
  allow write: if isAdmin();
}
```

**Superbase (RLS SQL)**
```sql
-- Helper function
create or replace function is_admin()
returns boolean as $$
  select exists (select 1 from roles_admin where user_id = auth.uid());
$$ language sql security definer;

-- Policy
create policy "Admins can manage events"
on events for all
using (is_admin());
```

### Owner Access
**Firebase**
```javascript
match /donations/{id} {
  allow read: if request.auth.uid == resource.data.userId;
}
```

**Superbase**
```sql
create policy "Users can see own donations"
on donations for select
using (auth.uid() = user_id);
```

---

## 2. Collection Translation Table

| Resource | Firebase Path | Superbase Table | Logic |
| :--- | :--- | :--- | :--- |
| Notices | `/notices/*` | `notices` | Read: Public, Write: Admin |
| Events | `/events/*` | `events` | Read: Public, Write: Admin |
| Gallery | `/gallery/*` | `gallery` | Read: Public, Write: Admin |
| User Profile | `/users/{id}` | `profiles` | Read/Write: Owner or Admin |
| Donations | `/users/{id}/donations/*` | `donations` | Read: Owner or Admin, Write: Service |
| Prayer Requests | `/prayer_requests/*` | `prayer_requests` | Create: Public, Read: Owner or Admin |

---

## 3. Deployment Notes
- Firestore rules are path-based and recursive.
- Supabase RLS policies are row-based and apply to the SQL query level.
- Always test your RLS policies in the Supabase Dashboard SQL Editor or via the UI "Policy Editor".