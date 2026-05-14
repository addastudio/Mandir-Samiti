# Decap CMS Auth Guide: Vercel + Netlify Identity

This project is configured to host the main site on **Vercel** while using **Netlify Identity** as the authentication bridge for Decap CMS.

## The Architecture
1.  **Frontend**: Hosted on Vercel (`suryamandir.online`).
2.  **Auth Provider**: Hosted on Netlify (`mandirsamiti.netlify.app`).
3.  **CMS**: Decap CMS, initialized at `/admin/`.

## Configuration Applied
- **Bridge Script**: `src/app/layout.tsx` and `public/admin/index.html` force `localStorage.setItem("netlifySiteURL", "https://mandirsamiti.netlify.app")`. This tells the CMS to ignore the current Vercel domain and look at Netlify for the "Git Gateway" handshake.
- **Admin Entry**: `public/admin/index.html` includes the Netlify Identity widget and standard redirect listeners.
- **CMS Config**: `public/admin/config.yml` uses `git-gateway` and defines collections for Hero, About, Seva, and Site Settings.

## Required Setup in Netlify Dashboard
To enable user logins from your Vercel domain, you **must** do the following in your Netlify account for the `mandirsamiti` site:

1.  **Configure Allowed Domains (Identity)**:
    - Go to **Site configuration** > **Identity** > **Settings**.
    - Find the **Allowed Domains** (or External Providers) section.
    - Add `https://www.suryamandir.online`
    - Add your Vercel deployment URL (e.g., `mandir-samiti-bahpura.vercel.app`).
    - *Note: This allows the Netlify Identity widget to accept login requests initiated from these external URLs.*

2.  **Enable Git Gateway**:
    - Go to **Site configuration** > **Identity** > **Services**.
    - Ensure **Git Gateway** is enabled and linked to your GitHub repository.

3.  **Invite Users**:
    - Set Registration to **Invite only**.
    - Send invites to the email addresses that will be editing the site.

---
**Status**: Vercel Host + Netlify Auth is now CONFIGURED.
