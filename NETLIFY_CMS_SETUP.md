# Netlify CMS (Decap CMS) Setup Guide

This project is configured with **Decap CMS** for non-technical content editing. Follow these steps to enable the administration interface.

## 1. Enable Netlify Identity
1. Go to your site dashboard on [Netlify](https://app.netlify.com).
2. Go to **Site configuration** > **Identity**.
3. Click **Enable Identity**.
4. Scroll down to **Registration preferences** and select **Invite only** (recommended for private temple sites).
5. In **Services** > **Git Gateway**, click **Enable Git Gateway**. This allows the CMS to talk to your GitHub repository.

## 2. Configure Site Settings
Ensure you have the following headers in your `netlify.toml` (already added) to allow Identity to communicate correctly.

## 3. Invite Users
1. Go to the **Identity** tab in Netlify.
2. Click **Invite users** and enter the email addresses of the committee members who will edit the site.
3. They will receive an email to confirm their account.

## 4. Accessing the Admin Panel
1. Visit `https://your-site-name.netlify.app/admin`.
2. You will be prompted to log in via Netlify Identity.
3. Once logged in, you can create, edit, and delete Notices, Events, and Pages.

## 5. How it Works
- When you click **Save** in the CMS, it creates a new commit in your GitHub repository.
- Netlify detects this commit and automatically triggers a new build of the website.
- After a few minutes, your changes will be live on the site.

## 6. Development
If you want to test the CMS locally:
1. Run `npx netlify-cms-proxy-server` in a separate terminal.
2. In `config.yml`, temporarily set `local_backend: true`.
3. Open `http://localhost:3000/admin`.

---
**Note:** Your existing Firebase Authentication and Firestore logic remain completely intact. The CMS only handles the Markdown content files stored in the repository.
