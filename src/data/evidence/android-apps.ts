import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const records = [
  // Search for Eats
  {
    id: 'search-for-eats-purpose',
    title: 'Search for Eats purpose',
    statement:
      'Search for Eats is a restaurant-discovery Android app with map and list views, category filters, rating sort, and offline recent results. It was delivered to a client and was not published to Google Play.',
    topics: ['Search for Eats', 'Android', 'restaurant discovery'],
    aliases: ['restaurant finder'],
    roleWeights: { aiml: 0, software: 2, android: 4, teaching: 1 },
    sourceIds: ['resume-android', 'case-study-search-for-eats'],
    public: true,
  },
  {
    id: 'search-for-eats-stack',
    title: 'Search for Eats stack',
    statement:
      'Search for Eats is built in Java with Google Maps Platform, Firebase, and Retrofit.',
    topics: ['Search for Eats', 'Java', 'Google Maps', 'Firebase', 'Retrofit'],
    aliases: ['Search for Eats technologies'],
    roleWeights: { aiml: 0, software: 2, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-search-for-eats'],
    public: true,
  },
  // Food Planner
  {
    id: 'food-planner-purpose',
    title: 'Food Planner purpose',
    statement:
      'Healthy Habit / Food Planner is a recipe and meal-planning Android app: meal of the day, search by country or ingredient, weekly plans, reminders, favourites, and offline access. It was built during the ITI Android track and published to Google Play as part of that training, not as a client listing.',
    topics: ['Food Planner', 'Android', 'recipes', 'meal planning', 'ITI'],
    aliases: ['Healthy Habit'],
    roleWeights: { aiml: 0, software: 2, android: 4, teaching: 1 },
    sourceIds: ['resume-android', 'case-study-food-planner'],
    public: true,
  },
  {
    id: 'food-planner-stack',
    title: 'Food Planner stack',
    statement:
      'Food Planner uses an MVP architecture in Java with Retrofit for TheMealDB API, Room for favourites and the weekly plan, Firebase Auth (with a guest mode), and WorkManager for reminders.',
    topics: ['Food Planner', 'MVP', 'Retrofit', 'Room', 'WorkManager'],
    aliases: ['Food Planner technologies'],
    roleWeights: { aiml: 0, software: 2, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-food-planner'],
    public: true,
  },
  // Weather Checker
  {
    id: 'weather-checker-purpose',
    title: 'Weather Checker purpose',
    statement:
      'Weather Checker is an Android app for current, hourly, and daily forecasts, favourite places, map picking, and weather alarms, built during the ITI Android Mobile Development track (2023) with 9 unit-test files.',
    topics: ['Weather Checker', 'Android', 'forecasts', 'ITI'],
    aliases: ['weather app'],
    roleWeights: { aiml: 0, software: 2, android: 4, teaching: 1 },
    sourceIds: ['resume-android', 'case-study-weather-checker'],
    public: true,
  },
  {
    id: 'weather-checker-stack',
    title: 'Weather Checker stack',
    statement:
      'Weather Checker is built in Kotlin with MVVM, Coroutines, Retrofit, Room, and Google Maps, using repository abstractions and fake data sources so its ViewModels can be unit-tested.',
    topics: ['Weather Checker', 'Kotlin', 'MVVM', 'Coroutines'],
    aliases: ['Weather Checker technologies'],
    roleWeights: { aiml: 0, software: 2, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-weather-checker'],
    public: true,
  },
  // Shop on the Go
  {
    id: 'shop-on-the-go-purpose',
    title: 'Shop on the Go purpose',
    statement:
      'Shop on the Go is a mobile storefront with catalogue browsing, favourites, cart, coupons, a draft-order checkout, and multi-currency support, built during the ITI Android Mobile Development track (2023). I built it with my ITI team, and separately built my own individual implementation.',
    topics: ['Shop on the Go', 'Android', 'e-commerce', 'ITI'],
    aliases: ['ShopOnTheGo'],
    roleWeights: { aiml: 0, software: 2, android: 4, teaching: 1 },
    sourceIds: ['resume-android', 'case-study-shop-on-the-go'],
    public: true,
  },
  {
    id: 'shop-on-the-go-stack',
    title: 'Shop on the Go stack',
    statement:
      'Shop on the Go is built in Kotlin with MVVM, Coroutines/Flow, Retrofit, Room, DataStore, and Firebase Auth.',
    topics: ['Shop on the Go', 'Kotlin', 'MVVM', 'Retrofit'],
    aliases: ['Shop on the Go technologies'],
    roleWeights: { aiml: 0, software: 2, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-shop-on-the-go'],
    public: true,
  },
  // Your Life Is My Life
  {
    id: 'your-life-is-my-life-purpose',
    title: 'Your Life Is My Life purpose',
    statement:
      'Your Life Is My Life is a private Android wellbeing app for personal check-ins and a trusted circle of contacts, using non-clinical language throughout. It was previously published under a client-owned Google Play listing and is no longer available.',
    topics: ['Your Life Is My Life', 'Android', 'wellbeing'],
    aliases: [],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-your-life-is-my-life'],
    public: true,
  },
  {
    id: 'your-life-is-my-life-stack',
    title: 'Your Life Is My Life stack',
    statement:
      'Your Life Is My Life is built in Java with Firebase Authentication, Google Maps / Location for its trusted circle, and Material Design.',
    topics: ['Your Life Is My Life', 'Java', 'Firebase', 'Google Maps'],
    aliases: [],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-your-life-is-my-life'],
    public: true,
  },
  // The Death Ninja
  {
    id: 'death-ninja-purpose',
    title: 'The Death Ninja purpose',
    statement:
      'The Death Ninja is a Unity platformer for Android with levels, collectibles, a boss fight, and a choice of two characters. It was previously published under a client-owned Google Play listing and is no longer available.',
    topics: ['The Death Ninja', 'Unity', 'game'],
    aliases: ['Death Ninja'],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-death-ninja'],
    public: true,
  },
  {
    id: 'death-ninja-delivery',
    title: 'The Death Ninja delivery',
    statement:
      'I built The Death Ninja end to end with Unity and the Google Play Console, including rendering and input-latency optimisation, crash/ANR triage, and AAB signing with staged rollout.',
    topics: ['The Death Ninja', 'Unity', 'Google Play Console'],
    aliases: [],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-death-ninja'],
    public: true,
  },
  // Gulf Arab Chat
  {
    id: 'gulf-arab-chat-purpose',
    title: 'Gulf Arab Chat purpose',
    statement:
      'Gulf Arab Chat is a multilingual Android social app with chat, calls, live streams, nearby discovery, and privacy controls in English, Arabic, and French. I built it end to end, integrating third-party UI and media modules; the repo bundles many.',
    topics: ['Gulf Arab Chat', 'Android', 'social', 'multilingual'],
    aliases: [],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-gulf-arab-chat'],
    public: true,
  },
  {
    id: 'gulf-arab-chat-stack',
    title: 'Gulf Arab Chat stack',
    statement:
      'Gulf Arab Chat is built in Java with Firebase and Google Maps / Location.',
    topics: ['Gulf Arab Chat', 'Java', 'Firebase'],
    aliases: [],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-gulf-arab-chat'],
    public: true,
  },
  // Tourist Guide
  {
    id: 'tourist-guide-purpose',
    title: 'Tourist Guide purpose',
    statement:
      'Tourist Guide is an Android app for a trip: tourism advice and posts, maps and address confirmation, taxi assistance, translation, and hotel, restaurant, and special-service management for admins. I built it end to end.',
    topics: ['Tourist Guide', 'Android', 'travel'],
    aliases: [],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-tourist-guide'],
    public: true,
  },
  {
    id: 'tourist-guide-stack',
    title: 'Tourist Guide stack',
    statement:
      'Tourist Guide is built in Java with Firebase and Google Maps / Location.',
    topics: ['Tourist Guide', 'Java', 'Firebase'],
    aliases: [],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-tourist-guide'],
    public: true,
  },
  // SAMS
  {
    id: 'sams-purpose',
    title: 'SAMS purpose',
    statement:
      'SAMS is a student academic management Android app with separate student and professor dashboards for courses, groups, attendance, grades, and content. I built it end to end.',
    topics: ['SAMS', 'Android', 'education'],
    aliases: ['Student Academic Management System'],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 2 },
    sourceIds: ['resume-android', 'case-study-sams'],
    public: true,
  },
  {
    id: 'sams-stack',
    title: 'SAMS stack',
    statement:
      'SAMS is built in Java with Firebase Authentication and Firebase Realtime Database.',
    topics: ['SAMS', 'Java', 'Firebase'],
    aliases: [],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 1 },
    sourceIds: ['resume-android', 'case-study-sams'],
    public: true,
  },
  // Donation App
  {
    id: 'donation-app-purpose',
    title: 'Donation Management App purpose',
    statement:
      'The Donation Management App lets people post donations and requests, with admin dashboards tracking waiting, accepted, and declined states. I built it end to end.',
    topics: ['Donation Management App', 'Android', 'community'],
    aliases: [],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-donation-app'],
    public: true,
  },
  {
    id: 'donation-app-stack',
    title: 'Donation Management App stack',
    statement:
      'The Donation Management App is built in Java with Firebase Authentication, Firebase Realtime Database, and Firebase Storage.',
    topics: ['Donation Management App', 'Java', 'Firebase'],
    aliases: [],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-donation-app'],
    public: true,
  },
  // My Card
  {
    id: 'my-card-purpose',
    title: 'My Card purpose',
    statement:
      'My Card is a guided Android greeting-card builder: occasion categories, ready-made or custom paths, a final preview, and order details. I built it end to end; no payment gateway is verified.',
    topics: ['My Card', 'Android', 'greeting cards'],
    aliases: [],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-my-card'],
    public: true,
  },
  {
    id: 'my-card-stack',
    title: 'My Card stack',
    statement: 'My Card is built in Java with Firebase.',
    topics: ['My Card', 'Java', 'Firebase'],
    aliases: [],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-my-card'],
    public: true,
  },
  // Top Notch
  {
    id: 'top-notch-purpose',
    title: 'Top Notch purpose',
    statement:
      'Top Notch is a recipe-community Android app with recipe search, community and member recipes, a personal recipe diary, a cooking calendar, and a timer. I built it end to end.',
    topics: ['Top Notch', 'Android', 'recipes', 'community'],
    aliases: [],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-top-notch'],
    public: true,
  },
  {
    id: 'top-notch-stack',
    title: 'Top Notch stack',
    statement:
      'Top Notch is built in Java with Firebase; its recipe API client is a prose-only detail.',
    topics: ['Top Notch', 'Java', 'Firebase'],
    aliases: [],
    roleWeights: { aiml: 0, software: 1, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-top-notch'],
    public: true,
  },
  // MyApps (card, no page, but grounded for the assistant)
  {
    id: 'myapps-demo-purpose',
    title: 'MyApps purpose',
    statement:
      'MyApps is a learning demo: one Android app that organizes access to common web services through an in-app WebView. It is not a password manager or single sign-on system.',
    topics: ['MyApps', 'Android', 'WebView', 'learning demo'],
    aliases: [],
    roleWeights: { aiml: 0, software: 1, android: 3, teaching: 0 },
    sourceIds: ['resume-android'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const androidAppsEvidence = evidenceRecordSchema.array().parse(records);
