export type ProjectImageId = 'dive' | 'dostava' | 'minds-eye' | 'death-ninja';

export interface ProjectImage {
  id: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  avifSrcset: string;
  webpSrcset: string;
  fallbackSrc: string;
}

export const projectImages: Readonly<Record<ProjectImageId, ProjectImage[]>> = {
  dive: [
    {
      id: 'hospital-map',
      alt: 'Dive map showing nearby hospitals and emergency planning locations',
      caption:
        'Location-aware safety planning surfaces nearby hospitals directly on the map.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dive/hospital-map-480.avif 480w, /images/projects/dive/hospital-map-768.avif 768w, /images/projects/dive/hospital-map-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dive/hospital-map-480.webp 480w, /images/projects/dive/hospital-map-768.webp 768w, /images/projects/dive/hospital-map-1110.webp 1110w',
      fallbackSrc: '/images/projects/dive/hospital-map-768.webp',
    },
    {
      id: 'emergency-actions',
      alt: 'Dive emergency screen with accident reporting and nearby hospital actions',
      caption:
        'The emergency workflow brings accident reporting, hospital discovery, and direct assistance together.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dive/emergency-actions-480.avif 480w, /images/projects/dive/emergency-actions-768.avif 768w, /images/projects/dive/emergency-actions-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dive/emergency-actions-480.webp 480w, /images/projects/dive/emergency-actions-768.webp 768w, /images/projects/dive/emergency-actions-1110.webp 1110w',
      fallbackSrc: '/images/projects/dive/emergency-actions-768.webp',
    },
  ],
  dostava: [
    {
      id: 'restaurant-list',
      alt: 'Dostava restaurant list for choosing an order destination',
      caption:
        'A category-specific restaurant list supports the first step of the customer ordering flow.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dostava/restaurant-list-480.avif 480w, /images/projects/dostava/restaurant-list-768.avif 768w, /images/projects/dostava/restaurant-list-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dostava/restaurant-list-480.webp 480w, /images/projects/dostava/restaurant-list-768.webp 768w, /images/projects/dostava/restaurant-list-1110.webp 1110w',
      fallbackSrc: '/images/projects/dostava/restaurant-list-768.webp',
    },
    {
      id: 'produce-order',
      alt: 'Dostava fresh produce order form with Arabic order instructions',
      caption:
        'The free-form produce workflow captures merchant and item details before adding the request to the cart.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dostava/produce-order-480.avif 480w, /images/projects/dostava/produce-order-768.avif 768w, /images/projects/dostava/produce-order-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dostava/produce-order-480.webp 480w, /images/projects/dostava/produce-order-768.webp 768w, /images/projects/dostava/produce-order-1110.webp 1110w',
      fallbackSrc: '/images/projects/dostava/produce-order-768.webp',
    },
  ],
  // Media pipeline (§5.7) has not extracted these yet — empty until it does.
  'minds-eye': [],
  'death-ninja': [],
};
