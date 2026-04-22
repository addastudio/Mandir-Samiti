# Contentful CMS Integration Guide

This guide explains how to connect your Mandir Samiti Bahpura website to Contentful to manage core information without touching code.

---

## 1. Initial Setup
1.  **Create Account**: Sign up at [Contentful.com](https://www.contentful.com).
2.  **Create Space**: Create a new space named "Mandir Bahpura".
3.  **Get Keys**: Go to **Settings > API keys** and copy your `Space ID` and `Content Delivery API - access token`.

---

## 2. Environment Variables
Add these to your `.env` file or hosting provider (Netlify/Firebase):

```bash
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_ACCESS_TOKEN=your_access_token
```

---

## 3. Create Content Model
In Contentful, go to **Content model** and create a new type:

### Model Name: `Site Content`
- **API Identifier**: `siteContent`

#### Fields to Add:
| Field Name | Type | API ID | Description |
| :--- | :--- | :--- | :--- |
| **Hindi History** | Text (Long) | `hiHistory` | Hindi 'About Us' first paragraph |
| **English History** | Text (Long) | `enHistory` | English 'About Us' first paragraph |
| **Hindi Mission** | Text (Long) | `hiMission` | Hindi 'Our Mission' text |
| **English Mission** | Text (Long) | `enMission` | English 'Our Mission' text |
| **Map Embed URL** | Text (Short) | `mapUrl` | Google Maps iframe src URL |
| **Hindi Address** | Text (Short) | `hiAddress` | Full Hindi address line |
| **English Address** | Text (Short) | `enAddress` | Full English address line |
| **Phone** | Text (Short) | `phone` | Temple contact number |
| **Email** | Text (Short) | `email` | Temple contact email |

---

## 4. How the Website Syncs
- The website attempts to fetch data from Contentful on every page load.
- **Fallbacks**: If a field is empty in Contentful or the API keys are missing, the website automatically uses the high-quality bilingual translations stored in `src/lib/translations.ts`.
- **Admin Status**: You can verify if Contentful is successfully connected by checking the **Settings** tab in your Website Admin Panel.

---

## 5. Deployment
When deploying to Netlify, ensure the environment variables are set in the Netlify Dashboard (**Site configuration > Environment variables**). The website will detect them and switch to "CMS Mode" automatically.

