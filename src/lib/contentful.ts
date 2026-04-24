
import { createClient } from 'contentful';

/**
 * Contentful CMS Client Utility
 * 
 * Configures connection to Contentful using environment variables.
 */

const spaceId = process.env.CONTENTFUL_SPACE_ID || process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID;
const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN || process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN;

export const isContentfulConfigured = !!(spaceId && accessToken);

export const contentfulClient = isContentfulConfigured 
  ? createClient({
      space: spaceId!,
      accessToken: accessToken!,
    })
  : null;

/**
 * Helper to fetch a single entry by its content type and slug/ID.
 */
export async function getContentfulSiteContent() {
  if (!contentfulClient) return null;

  try {
    const entries = await contentfulClient.getEntries({
      content_type: 'siteContent',
      limit: 1,
    });
    
    if (entries.items.length > 0) {
      return entries.items[0].fields;
    }
    return null;
  } catch (error) {
    console.error('Contentful Fetch Error:', error);
    return null;
  }
}

/**
 * Reporting helper for Admin Panel.
 */
export function getContentfulStatus() {
  return {
    active: isContentfulConfigured,
    label: isContentfulConfigured ? "Contentful (Active)" : "Contentful (Offline)",
    spaceId: spaceId ? `${spaceId.substring(0, 5)}...` : 'N/A'
  };
}
