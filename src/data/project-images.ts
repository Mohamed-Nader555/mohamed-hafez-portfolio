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
      id: 'login',
      alt: 'Dive app sign-in screen with email, password, and a Google sign-in option',
      caption:
        'Sign-in supports email or Google, with verification required before any dive data is saved.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dive/login-480.avif 480w, /images/projects/dive/login-768.avif 768w, /images/projects/dive/login-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dive/login-480.webp 480w, /images/projects/dive/login-768.webp 768w, /images/projects/dive/login-1110.webp 1110w',
      fallbackSrc: '/images/projects/dive/login-768.webp',
    },
    {
      id: 'home',
      alt: 'Dive home screen with diving tips and a guide to the Egyptian dive sites',
      caption:
        'The home screen surfaces diving tips and a guide to dive sites along the Egyptian coast.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dive/home-480.avif 480w, /images/projects/dive/home-768.avif 768w, /images/projects/dive/home-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dive/home-480.webp 480w, /images/projects/dive/home-768.webp 768w, /images/projects/dive/home-1110.webp 1110w',
      fallbackSrc: '/images/projects/dive/home-768.webp',
    },
    {
      id: 'weather',
      alt: "Dive weather screen showing today's conditions and an hourly forecast",
      caption:
        "Live weather for the diver's location, pulled in alongside the rest of the planning tools.",
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dive/weather-480.avif 480w, /images/projects/dive/weather-768.avif 768w, /images/projects/dive/weather-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dive/weather-480.webp 480w, /images/projects/dive/weather-768.webp 768w, /images/projects/dive/weather-1110.webp 1110w',
      fallbackSrc: '/images/projects/dive/weather-768.webp',
    },
    {
      id: 'mod-calculator',
      alt: 'MOD calculator screen computing maximum operating depth from oxygen fraction and partial pressure',
      caption:
        'The MOD calculator works out maximum operating depth from FO₂ and PPO₂ inputs.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dive/mod-calculator-480.avif 480w, /images/projects/dive/mod-calculator-768.avif 768w, /images/projects/dive/mod-calculator-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dive/mod-calculator-480.webp 480w, /images/projects/dive/mod-calculator-768.webp 768w, /images/projects/dive/mod-calculator-1110.webp 1110w',
      fallbackSrc: '/images/projects/dive/mod-calculator-768.webp',
    },
    {
      id: 'erdpml-pressure',
      alt: 'eRDPML calculator showing the pressure group after a first dive',
      caption:
        "eRDPML implements the PADI RDP tables, here showing a diver's pressure group after a first dive.",
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dive/erdpml-pressure-480.avif 480w, /images/projects/dive/erdpml-pressure-768.avif 768w, /images/projects/dive/erdpml-pressure-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dive/erdpml-pressure-480.webp 480w, /images/projects/dive/erdpml-pressure-768.webp 768w, /images/projects/dive/erdpml-pressure-1110.webp 1110w',
      fallbackSrc: '/images/projects/dive/erdpml-pressure-768.webp',
    },
    {
      id: 'erdpml-warning',
      alt: 'eRDPML calculator warning that a planned dive exceeds the no-decompression limit',
      caption:
        'The same calculator warns outright when a planned dive exceeds the no-decompression limit.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dive/erdpml-warning-480.avif 480w, /images/projects/dive/erdpml-warning-768.avif 768w, /images/projects/dive/erdpml-warning-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dive/erdpml-warning-480.webp 480w, /images/projects/dive/erdpml-warning-768.webp 768w, /images/projects/dive/erdpml-warning-1110.webp 1110w',
      fallbackSrc: '/images/projects/dive/erdpml-warning-768.webp',
    },
    {
      id: 'sim-input',
      alt: "AI Simulation form with a planned dive's max depth, bottom time, and oxygen mix",
      caption:
        'The AI Simulation form takes a planned dive — max depth, bottom time, and gas mix — before checking it against the model.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dive/sim-input-480.avif 480w, /images/projects/dive/sim-input-768.avif 768w, /images/projects/dive/sim-input-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dive/sim-input-480.webp 480w, /images/projects/dive/sim-input-768.webp 768w, /images/projects/dive/sim-input-1110.webp 1110w',
      fallbackSrc: '/images/projects/dive/sim-input-768.webp',
    },
    {
      id: 'safe-result',
      alt: "AI Simulation result reading 'The dive is safe.'",
      caption: 'A plan the model accepts returns a simple, direct verdict.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dive/safe-result-480.avif 480w, /images/projects/dive/safe-result-768.avif 768w, /images/projects/dive/safe-result-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dive/safe-result-480.webp 480w, /images/projects/dive/safe-result-768.webp 768w, /images/projects/dive/safe-result-1110.webp 1110w',
      fallbackSrc: '/images/projects/dive/safe-result-768.webp',
    },
    {
      id: 'unsafe-result',
      alt: "AI Simulation result reading 'The dive is not safe.' with a Recommend a Safe One button",
      caption:
        'When a plan is flagged unsafe, "Recommend a Safe One!" hands it to the recommendation loop.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dive/unsafe-result-480.avif 480w, /images/projects/dive/unsafe-result-768.avif 768w, /images/projects/dive/unsafe-result-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dive/unsafe-result-480.webp 480w, /images/projects/dive/unsafe-result-768.webp 768w, /images/projects/dive/unsafe-result-1110.webp 1110w',
      fallbackSrc: '/images/projects/dive/unsafe-result-768.webp',
    },
    {
      id: 'safer-plan',
      alt: 'AI Simulation suggesting a safer dive with reduced depth and bottom time',
      caption:
        'From 45 m / 10 min, the app searched shallower and shorter until the model accepted a plan: 37 m / 2 min.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dive/safer-plan-480.avif 480w, /images/projects/dive/safer-plan-768.avif 768w, /images/projects/dive/safer-plan-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dive/safer-plan-480.webp 480w, /images/projects/dive/safer-plan-768.webp 768w, /images/projects/dive/safer-plan-1110.webp 1110w',
      fallbackSrc: '/images/projects/dive/safer-plan-768.webp',
    },
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
      id: 'splash',
      alt: 'Dostava splash screen with the delivery-bicycle logo',
      caption:
        '"Just order and relax" — the splash screen customers see first.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dostava/splash-480.avif 480w, /images/projects/dostava/splash-768.avif 768w, /images/projects/dostava/splash-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dostava/splash-480.webp 480w, /images/projects/dostava/splash-768.webp 768w, /images/projects/dostava/splash-1110.webp 1110w',
      fallbackSrc: '/images/projects/dostava/splash-768.webp',
    },
    {
      id: 'category-menu',
      alt: "Dostava circular category menu under the heading 'Order Anything You Want'",
      caption:
        'A single circular menu gives a fast route into supermarket, produce, meat, and restaurant orders.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dostava/category-menu-480.avif 480w, /images/projects/dostava/category-menu-768.avif 768w, /images/projects/dostava/category-menu-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dostava/category-menu-480.webp 480w, /images/projects/dostava/category-menu-768.webp 768w, /images/projects/dostava/category-menu-1110.webp 1110w',
      fallbackSrc: '/images/projects/dostava/category-menu-768.webp',
    },
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
      id: 'supermarket-order',
      alt: 'Dostava free-form supermarket order screen with Arabic order instructions',
      caption:
        'A free-form supermarket order lets a customer describe exactly what they want, in their own words.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dostava/supermarket-order-480.avif 480w, /images/projects/dostava/supermarket-order-768.avif 768w, /images/projects/dostava/supermarket-order-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dostava/supermarket-order-480.webp 480w, /images/projects/dostava/supermarket-order-768.webp 768w, /images/projects/dostava/supermarket-order-1110.webp 1110w',
      fallbackSrc: '/images/projects/dostava/supermarket-order-768.webp',
    },
    {
      id: 'meat-order',
      alt: 'Dostava free-form meat and chicken order screen with Arabic order instructions',
      caption:
        'The same free-form pattern covers meat and chicken orders from a local butcher.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dostava/meat-order-480.avif 480w, /images/projects/dostava/meat-order-768.avif 768w, /images/projects/dostava/meat-order-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dostava/meat-order-480.webp 480w, /images/projects/dostava/meat-order-768.webp 768w, /images/projects/dostava/meat-order-1110.webp 1110w',
      fallbackSrc: '/images/projects/dostava/meat-order-768.webp',
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
    {
      id: 'order-status',
      alt: 'Dostava order status list showing delivered and in-preparation orders, with customer name and area blurred',
      caption:
        'Order status stays visible from "being prepared" to "delivered" — customer name and delivery area are blurred here for privacy.',
      width: 1110,
      height: 2220,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/dostava/order-status-480.avif 480w, /images/projects/dostava/order-status-768.avif 768w, /images/projects/dostava/order-status-1110.avif 1110w',
      webpSrcset:
        '/images/projects/dostava/order-status-480.webp 480w, /images/projects/dostava/order-status-768.webp 768w, /images/projects/dostava/order-status-1110.webp 1110w',
      fallbackSrc: '/images/projects/dostava/order-status-768.webp',
    },
  ],
  'minds-eye': [
    {
      id: 'login',
      alt: "Mind's Eye login screen with the glasses-and-brain app icon",
      caption: 'The Android app opens on a simple email and password sign-in.',
      width: 761,
      height: 1397,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/minds-eye/login-480.avif 480w, /images/projects/minds-eye/login-761.avif 761w',
      webpSrcset:
        '/images/projects/minds-eye/login-480.webp 480w, /images/projects/minds-eye/login-761.webp 761w',
      fallbackSrc: '/images/projects/minds-eye/login-480.webp',
    },
    {
      id: 'home',
      alt: 'Home screen for choosing Alzheimer mode or Visually Impaired mode',
      caption:
        'The assistive mode is chosen here, in the app, never on the glasses themselves.',
      width: 759,
      height: 1478,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/minds-eye/home-480.avif 480w, /images/projects/minds-eye/home-759.avif 759w',
      webpSrcset:
        '/images/projects/minds-eye/home-480.webp 480w, /images/projects/minds-eye/home-759.webp 759w',
      fallbackSrc: '/images/projects/minds-eye/home-480.webp',
    },
    {
      id: 'vi-menu',
      alt: 'Visually Impaired mode menu listing image captioning, labels, face detection, object detection, text reader, and currency detection',
      caption:
        'Visually Impaired mode groups six recognition features behind one menu.',
      width: 761,
      height: 1482,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/minds-eye/vi-menu-480.avif 480w, /images/projects/minds-eye/vi-menu-761.avif 761w',
      webpSrcset:
        '/images/projects/minds-eye/vi-menu-480.webp 480w, /images/projects/minds-eye/vi-menu-761.webp 761w',
      fallbackSrc: '/images/projects/minds-eye/vi-menu-480.webp',
    },
    {
      id: 'face-start',
      alt: 'Face Recognition feature start screen with a Gallery button',
      caption: 'Opening Face Recognition offers a capture before it runs.',
      width: 769,
      height: 1478,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/minds-eye/face-start-480.avif 480w, /images/projects/minds-eye/face-start-769.avif 769w',
      webpSrcset:
        '/images/projects/minds-eye/face-start-480.webp 480w, /images/projects/minds-eye/face-start-769.webp 769w',
      fallbackSrc: '/images/projects/minds-eye/face-start-480.webp',
    },
    {
      id: 'select-action',
      alt: "'Select Action' dialog offering Take Photo or Choose Photo From Gallery",
      caption:
        'Every capture-driven feature shares the same take-photo-or-choose-from-gallery prompt.',
      width: 759,
      height: 1478,
      orientation: 'portrait',
      avifSrcset:
        '/images/projects/minds-eye/select-action-480.avif 480w, /images/projects/minds-eye/select-action-759.avif 759w',
      webpSrcset:
        '/images/projects/minds-eye/select-action-480.webp 480w, /images/projects/minds-eye/select-action-759.webp 759w',
      fallbackSrc: '/images/projects/minds-eye/select-action-480.webp',
    },
  ],
  'death-ninja': [
    {
      id: 'menu',
      alt: 'The Death Ninja main menu with Play, Options, and Quit over a moonlit silhouette',
      caption:
        'The main menu, set against the game’s recurring moonlit-rooftop art.',
      width: 2220,
      height: 1110,
      orientation: 'landscape',
      avifSrcset:
        '/images/projects/death-ninja/menu-480.avif 480w, /images/projects/death-ninja/menu-768.avif 768w, /images/projects/death-ninja/menu-2220.avif 2220w',
      webpSrcset:
        '/images/projects/death-ninja/menu-480.webp 480w, /images/projects/death-ninja/menu-768.webp 768w, /images/projects/death-ninja/menu-2220.webp 2220w',
      fallbackSrc: '/images/projects/death-ninja/menu-768.webp',
    },
    {
      id: 'level-1',
      alt: 'Platforming level with crates, a graveyard backdrop, coin counter, and life counter',
      caption:
        'A graveyard-themed platforming level, with coin and life counters tracked at the top of the screen.',
      width: 2220,
      height: 1110,
      orientation: 'landscape',
      avifSrcset:
        '/images/projects/death-ninja/level-1-480.avif 480w, /images/projects/death-ninja/level-1-768.avif 768w, /images/projects/death-ninja/level-1-2220.avif 2220w',
      webpSrcset:
        '/images/projects/death-ninja/level-1-480.webp 480w, /images/projects/death-ninja/level-1-768.webp 768w, /images/projects/death-ninja/level-1-2220.webp 2220w',
      fallbackSrc: '/images/projects/death-ninja/level-1-768.webp',
    },
    {
      id: 'level-2',
      alt: 'Platforming level with vertical shafts and floating platforms',
      caption:
        'A later platforming level built around vertical shafts and floating platforms.',
      width: 2220,
      height: 1110,
      orientation: 'landscape',
      avifSrcset:
        '/images/projects/death-ninja/level-2-480.avif 480w, /images/projects/death-ninja/level-2-768.avif 768w, /images/projects/death-ninja/level-2-2220.avif 2220w',
      webpSrcset:
        '/images/projects/death-ninja/level-2-480.webp 480w, /images/projects/death-ninja/level-2-768.webp 768w, /images/projects/death-ninja/level-2-2220.webp 2220w',
      fallbackSrc: '/images/projects/death-ninja/level-2-768.webp',
    },
    {
      id: 'boss',
      alt: "Boss encounter with the on-screen prompt 'Try To beat The Monster'",
      caption:
        'The final level ends in a boss encounter: "Try to beat the monster."',
      width: 2220,
      height: 1110,
      orientation: 'landscape',
      avifSrcset:
        '/images/projects/death-ninja/boss-480.avif 480w, /images/projects/death-ninja/boss-768.avif 768w, /images/projects/death-ninja/boss-2220.avif 2220w',
      webpSrcset:
        '/images/projects/death-ninja/boss-480.webp 480w, /images/projects/death-ninja/boss-768.webp 768w, /images/projects/death-ninja/boss-2220.webp 2220w',
      fallbackSrc: '/images/projects/death-ninja/boss-768.webp',
    },
    {
      id: 'options',
      alt: 'Options screen with a volume slider and a Ninja Boy or Ninja Girl character choice',
      caption:
        'Options cover volume and a choice between two playable characters, Ninja Boy or Ninja Girl.',
      width: 2220,
      height: 1110,
      orientation: 'landscape',
      avifSrcset:
        '/images/projects/death-ninja/options-480.avif 480w, /images/projects/death-ninja/options-768.avif 768w, /images/projects/death-ninja/options-2220.avif 2220w',
      webpSrcset:
        '/images/projects/death-ninja/options-480.webp 480w, /images/projects/death-ninja/options-768.webp 768w, /images/projects/death-ninja/options-2220.webp 2220w',
      fallbackSrc: '/images/projects/death-ninja/options-768.webp',
    },
    {
      id: 'win',
      alt: "Win screen reading 'You're winner!!!' with Play Again and Quit options",
      caption:
        'Beating the boss leads to a win screen and the option to play again.',
      width: 2220,
      height: 1110,
      orientation: 'landscape',
      avifSrcset:
        '/images/projects/death-ninja/win-480.avif 480w, /images/projects/death-ninja/win-768.avif 768w, /images/projects/death-ninja/win-2220.avif 2220w',
      webpSrcset:
        '/images/projects/death-ninja/win-480.webp 480w, /images/projects/death-ninja/win-768.webp 768w, /images/projects/death-ninja/win-2220.webp 2220w',
      fallbackSrc: '/images/projects/death-ninja/win-768.webp',
    },
  ],
};
