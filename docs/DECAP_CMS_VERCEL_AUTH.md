# Decap CMS Auth Guide: Fixed Identity Bridge

This project uses a hard-coded Identity bridge to allow Decap CMS to function on Vercel while using Netlify Identity as the authentication provider.

## Identity Configuration
The identity service is hosted at: `https://mandirsamiti.netlify.app`.

### How it works:
1.  **localStorage Bridge**: When the site loads on Vercel, a script in `src/app/layout.tsx` automatically sets `localStorage.setItem("netlifySiteURL", "https://mandirsamiti.netlify.app")`.
2.  **Admin Initialization**: When you visit `/admin/`, the Decap CMS initialization script checks this value and directs all authentication requests to the Netlify domain instead of the local Vercel domain.
3.  **Git Gateway**: The `config.yml` is configured with `site_domain: mandirsamiti.netlify.app` to ensure the handshake with your GitHub repository remains stable.

## Troubleshooting
If you still see a login error:
1.  **Clear Browser Data**: Clear your localStorage or open the site in Incognito mode to ensure the new bridge logic executes cleanly.
2.  **Check Netlify Settings**: Ensure that "Git Gateway" is enabled in your Netlify Dashboard and that your GitHub repository is correctly connected.
3.  **Invite Only**: We recommend setting Netlify Identity to "Invite Only" for security. Committee members must be invited via the Netlify Identity tab.

---
**Status**: The Identity bridge is now hard-coded to `mandirsamiti.netlify.app` for maximum reliability across deployments.
