# Decap CMS Auth Guide: Vercel + Netlify Identity

This project is now fully configured to host the main site on **Vercel** while using **Netlify Identity** as the authentication bridge for Decap CMS.

## The Architecture
1.  **Frontend**: Hosted on Vercel (`suryamandir.online`).
2.  **Auth Provider**: Hosted on Netlify (`mandirsamiti.netlify.app`).
3.  **CMS**: Decap CMS, initialized at `/admin/`.

## Configuration Applied
- **Bridge Script**: `src/app/layout.tsx` forces `localStorage.setItem("netlifySiteURL", "https://mandirsamiti.netlify.app")`. This tells the CMS to ignore the current Vercel domain and look at Netlify for the "Git Gateway" handshake.
- **Admin Entry**: `public/admin/index.html` includes the Netlify Identity widget and standard redirect listeners.
- **CMS Config**: `public/admin/config.yml` uses `git-gateway` and defines collections for Hero, About, Seva, and Site Settings.

## Required Setup in Netlify Dashboard
To avoid "Unauthorized" or "CORS" errors, you **must** do the following in your Netlify account for the `mandirsamiti` site:

1.  **Add Allowed Domains**:
    - Go to **Site configuration** > **Identity** > **External providers**.
    - Add `https://www.suryamandir.online`
    - Add your Vercel deployment URL (e.g., `mandir-samiti-bahpura.vercel.app`).
2.  **Enable Git Gateway**:
    - Ensure **Git Gateway** is enabled in **Identity** settings and linked to your GitHub repository.
3.  **Invite Users**:
    - Set Registration to **Invite only**.
    - Send invites to the email addresses that will be editing the site.

---
**Status**: Option 3 (Vercel Host + Netlify Auth) is now ACTIVE.
