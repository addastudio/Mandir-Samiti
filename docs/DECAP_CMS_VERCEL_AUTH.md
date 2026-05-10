# Decap CMS Auth Guide: Using Netlify Identity on Vercel

Since your site is deployed on both Netlify and Vercel, you can use your existing Netlify Identity setup to manage content even when accessing the CMS via your Vercel URL.

## 1. Configure the CMS Backend
The CMS is already updated in `public/admin/config.yml` to use `git-gateway`. To make this work on Vercel, the Decap CMS needs to know your primary Netlify site URL.

## 2. Update Environment Variables on Vercel
To allow your Vercel deployment to "talk" to Netlify Identity, add this environment variable in your **Vercel Dashboard**:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_NETLIFY_SITE_URL` | `https://your-mandir-site.netlify.app` |

*Replace the value with your actual Netlify `.app` URL.*

## 3. How Login Works on Vercel
1. Navigate to `https://your-vercel-site.com/admin`.
2. The Netlify Identity widget will appear.
3. If it doesn't automatically find the site, it will ask for your "Netlify Site URL". Enter your Netlify address.
4. Login with your usual credentials.
5. **Saving Content**: When you click "Publish", the CMS sends a request to Netlify's Git Gateway. Netlify then commits the change to your GitHub repo.
6. **Auto-Deploy**: Once the commit hits GitHub, both Vercel and Netlify will detect the change and trigger a fresh build automatically.

## 4. Troubleshooting
- **Infinite Spinner**: Ensure that "Git Gateway" is enabled in your Netlify Dashboard under **Site configuration > Identity > Services**.
- **Invite Only**: We recommend setting Identity to "Invite Only" for security. You can invite other committee members from the Netlify Identity tab.
