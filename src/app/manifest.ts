
import { MetadataRoute } from 'next';

/**
 * Dynamically generates the manifest.json file used by browsers and search engines
 * to identify the application's branding, icons, and theme.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Surya Mandir Bahpura',
    short_name: 'Surya Mandir',
    description: 'Official portal for Mandir Samiti Bahpura. Preserving faith and serving the community.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fffbeb',
    theme_color: '#d97706',
    icons: [
      {
        src: '/uploads/suryamandir.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
