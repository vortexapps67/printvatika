import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Print Vatika — Online Printing Press',
    short_name: 'Print Vatika',
    description: 'Commercial printing press in Delhi. Order visiting cards, flex banners, custom t-shirts, posters and brochures with live proofs.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1e40af',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/images/logo-mark.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/images/logo-mark.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['shopping', 'business'],
    shortcuts: [
      {
        name: 'Print Catalog',
        short_name: 'Catalog',
        description: 'Browse all printed products',
        url: '/catalog',
        icons: [{ src: '/images/logo-mark.png', sizes: '192x192' }],
      },
      {
        name: 'Track Order',
        short_name: 'Track',
        description: 'Check order and dispatch status',
        url: '/track',
        icons: [{ src: '/images/logo-mark.png', sizes: '192x192' }],
      },
      {
        name: 'Shopping Cart',
        short_name: 'Cart',
        description: 'View items ready for checkout',
        url: '/cart',
        icons: [{ src: '/images/logo-mark.png', sizes: '192x192' }],
      },
    ],
  };
}
