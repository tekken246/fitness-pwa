import type { MetadataRoute } from 'next';

/** Returns the installable PWA web app manifest. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fit Track',
    short_name: 'Fit Track',
    description: 'Mobile workout tracking and strength trend PWA.',
    start_url: '/today',
    scope: '/',
    display: 'standalone',
    background_color: '#0b1020',
    theme_color: '#0b1020',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
