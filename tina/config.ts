
import { defineConfig } from "tinacms";

// Your hosting provider login URL
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.suryamandir.online";

export default defineConfig({
  branch: process.env.VERCEL_GIT_COMMIT_REF || "main",
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      {
        name: "settings",
        label: "Site Settings",
        path: "content",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        match: {
          include: "settings",
        },
        fields: [
          {
            type: "string",
            name: "site_title_en",
            label: "Site Title (English)",
          },
          {
            type: "string",
            name: "site_title_hi",
            label: "Site Title (Hindi)",
          },
          {
            type: "image",
            name: "favicon",
            label: "Favicon / Logo",
          },
        ],
      },
      {
        name: "hero",
        label: "Homepage Hero",
        path: "content",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        match: {
          include: "hero",
        },
        fields: [
          {
            type: "string",
            name: "headline_en",
            label: "Headline (English)",
          },
          {
            type: "string",
            name: "headline_hi",
            label: "Headline (Hindi)",
          },
          {
            type: "string",
            name: "subtitle_en",
            label: "Subtitle (English)",
          },
          {
            type: "string",
            name: "subtitle_hi",
            label: "Subtitle (Hindi)",
          },
          {
            type: "string",
            name: "video_url",
            label: "Video Background URL",
          },
          {
            type: "image",
            name: "fallback_image",
            label: "Fallback Background Image",
          },
        ],
      },
      {
        name: "about",
        label: "About Page",
        path: "content",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        match: {
          include: "about",
        },
        fields: [
          {
            type: "string",
            name: "history_title_en",
            label: "History Title (English)",
          },
          {
            type: "string",
            name: "history_title_hi",
            label: "History Title (Hindi)",
          },
          {
            type: "string",
            name: "history_en",
            label: "History Text (English)",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "string",
            name: "history_hi",
            label: "History Text (Hindi)",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "string",
            name: "mission_title_en",
            label: "Mission Title (English)",
          },
          {
            type: "string",
            name: "mission_title_hi",
            label: "Mission Title (Hindi)",
          },
          {
            type: "string",
            name: "mission_en",
            label: "Mission Text (English)",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "string",
            name: "mission_hi",
            label: "Mission Text (Hindi)",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "image",
            name: "featured_image",
            label: "Featured Image",
          },
        ],
      },
      {
        name: "seva",
        label: "Seva Programs",
        path: "content/seva",
        format: "json",
        fields: [
          {
            type: "string",
            name: "title_en",
            label: "Title (English)",
          },
          {
            type: "string",
            name: "title_hi",
            label: "Title (Hindi)",
          },
          {
            type: "string",
            name: "desc_en",
            label: "Description (English)",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "string",
            name: "desc_hi",
            label: "Description (Hindi)",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "string",
            name: "icon",
            label: "Icon Name (Lucide)",
            options: [
              "UtensilsCrossed",
              "HeartHandshake",
              "BookOpenCheck",
              "Users",
              "Hand",
              "Shield",
            ],
          },
        ],
      },
    ],
  },
});
