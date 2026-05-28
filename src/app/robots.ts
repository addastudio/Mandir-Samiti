import { MetadataRoute } from 'next'

/**
 * Generates the robots.txt file for the application.
 * Directs search engines to crawl public content while ignoring private admin areas.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/', 
        '/management/', 
        '/dashboard/', 
        '/login/', 
        '/signup/'
      ],
    },
    sitemap: 'https://www.suryamandir.online/sitemap.xml',
  }
}
