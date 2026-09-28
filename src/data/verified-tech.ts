/**
 * Per-project technology allowlists. Only names that appear here may be
 * rendered as a technology chip (core chips in `projects.ts` or stack items
 * in a case-study MDX frontmatter `stack`). Source: PROJECTS_REWRITE_BRIEF.md
 * §7 (Core chips / Stack table) and §3.1 decisions D1/D5/D7/D8/D12/D13.
 */
export const VERIFIED_TECH: Readonly<Record<string, readonly string[]>> = {
  // §7.1 — thesis deck / Thesis-Experiments repo (source rank 2, 8)
  'asc-pie': [
    'Python',
    'PyTorch',
    'Hugging Face Transformers',
    'Hugging Face Datasets',
    'scikit-learn',
    'Jupyter / Colab',
    'seqeval',
  ],
  // §7.2 — thesis deck (source rank 2)
  'sprint-pp': [
    'Python',
    'PyTorch',
    'RoBERTa-large',
    'Hugging Face Transformers',
  ],
  // §7.3 — Northstar repo README (source rank 8)
  'northstar-rag': [
    'Python',
    'FastAPI',
    'LangChain',
    'sentence-transformers',
    'Chroma',
    'RAGAS',
    'PyMuPDF',
    'Uvicorn',
    'pytest',
    'Docker Compose',
    'OpenAI-compatible LLM client',
  ],
  // §7.4 — Mind's Eye deck, D5, D6, D16 (source rank 2, 4, 8)
  'minds-eye': [
    'Android (Java)',
    'ESP32-CAM',
    'Bluetooth',
    'Python (Flask)',
    'Google Cloud Vision',
    'Azure Computer Vision',
    'OpenCV',
    'face_recognition / dlib',
    'Tesseract OCR',
    'Firebase',
    'Heroku',
    'Retrofit',
    'TextToSpeech',
    'TalkBack',
    'Arduino framework',
    'Android Studio',
    'PyCharm',
    'Google Colab',
  ],
  // §7.5 — Dive deck / Master CV, D13 (source rank 4, 6, 7)
  dive: [
    'Android (Java/XML)',
    'Python',
    'scikit-learn',
    'Firebase',
    'Google Cloud Platform',
    'Google Maps Platform',
    'OpenWeather',
    'PythonAnywhere',
    'Retrofit',
    'Gson',
    'OpenCSV',
    'Lottie',
    'Glide',
    'JUnit',
    'Espresso',
    'Google Colab',
    'PyCharm',
  ],
  // §7.6, D1 — repo stack, resolved by Mohamed (source rank 1)
  dostava: [
    'Android (Java)',
    'Firebase Realtime Database',
    'Firebase Auth',
    'Firebase Storage',
    'Firebase Analytics',
    'AndroidX Lifecycle (ViewModel/LiveData)',
    'Facebook Login',
    'AdMob',
  ],
  // §7.7 — Master Project Portfolio #11-21 (source rank 7)
  'applied-ml-portfolio': [
    'Python',
    'pandas',
    'scikit-learn',
    'TensorFlow/Keras',
    'PyTorch',
    'Docker',
  ],
  // §7.8 — MPP #05, GitHub audit (source rank 7, 8)
  'cti-intrusion-detection': [
    'Python',
    'pandas',
    'scikit-learn',
    'TensorFlow/Keras',
    'Matplotlib',
    'Seaborn',
  ],
  // §7.9 — repo + CS §4.7 (source rank 8, 9); Room deliberately excluded
  'search-for-eats': [
    'Android (Java)',
    'Google Maps Platform',
    'Firebase',
    'Retrofit',
  ],
  // §7.10 — CS §4.8 repo-verified features (source rank 9)
  mercato: [
    'Android (Java)',
    'ExoPlayer',
    'Firebase',
    'FCM',
    'Google Play Billing',
  ],
  // §7.11 — repo README, MPP #34 (source rank 7, 8)
  'food-planner': [
    'Android (Java)',
    'MVP',
    'Retrofit',
    'Room',
    'Firebase Auth',
    'WorkManager',
    'TheMealDB API',
    'Lottie',
    'SharedPreferences',
    'Material Design',
  ],
  // §7.12 — MPP #38 (source rank 7)
  'weather-checker': [
    'Android (Kotlin)',
    'MVVM',
    'Coroutines',
    'Retrofit',
    'Room',
    'Google Maps',
  ],
  // §7.13 — MPP #37 (source rank 7)
  'shop-on-the-go': [
    'Android (Kotlin)',
    'MVVM',
    'Coroutines/Flow',
    'Retrofit',
    'Room',
    'Firebase Auth',
    'DataStore',
    'JUnit',
    'Material components',
  ],
  // §7.14, D12 — resolved by Mohamed (source rank 1)
  'documentum-workflows': [
    'OpenText Documentum',
    'DQL',
    'Documentum Composer',
    'Java',
    'Oracle Database',
    'Microsoft SQL Server',
    'Git',
  ],
  // §7.15, D12 (source rank 1)
  'pdf-utilities': ['Java', 'iText', 'Apache Tomcat', 'Maven', 'log4j'],
  // §7.16, D12 (source rank 1)
  'rest-pocs': [
    'Java',
    'Spring Boot',
    'REST',
    'SOAP',
    'Python',
    'JSON Schema',
    'Oracle Database',
    'Microsoft SQL Server',
    'Apache Tomcat',
    'Git',
  ],
  // §7.17 — PROJECT_HANDOFF.md and the code itself (source: repo)
  'this-portfolio': [
    'Astro',
    'TypeScript',
    'Cloudflare Workers',
    'Workers AI',
    'Zod',
    'Playwright',
    'React',
    'Turnstile',
    'Vitest',
    'MDX',
  ],
  // §7.18, D7 — resolved by Mohamed (source rank 1)
  'your-life-is-my-life': [
    'Android (Java)',
    'Firebase Auth',
    'Google Maps / Location',
    'Material Design',
  ],
  // §7.19, D8 — screenshots (source rank 5)
  'death-ninja': ['Unity', 'Android', 'Google Play Console'],
  // §7.20 — MPP #26, audit (source rank 7, 8)
  'cloud-backend': ['Node.js', 'Express', 'MongoDB', 'Mongoose', 'JWT'],
  // §7.21, D15 — resolved by Mohamed (source rank 1)
  'restaurant-management': ['Java', 'Swing', 'JUnit'],
  // §7.22, D15 (source rank 1)
  'online-tic-tac-toe': ['Java', 'JavaFX', 'Sockets', 'Minimax'],
  // §7.25, D15 — MPP #42, audit (source rank 1, 7, 8)
  'gulf-arab-chat': ['Android (Java)', 'Firebase', 'Google Maps / Location'],
  // §7.26 — MPP #43 (source rank 7)
  'tourist-guide': ['Android (Java)', 'Firebase', 'Google Maps / Location'],
  // §7.27 — MPP #40 (source rank 7)
  sams: ['Android (Java)', 'Firebase Auth', 'Firebase Realtime Database'],
  // §7.28 — MPP #41 (source rank 7)
  'donation-app': [
    'Android (Java)',
    'Firebase Auth',
    'Firebase Realtime Database',
    'Firebase Storage',
  ],
  // §7.29 — MPP #44 (source rank 7)
  'my-card': ['Android (Java)', 'Firebase'],
  // §7.30 — MPP #46 (source rank 7)
  'top-notch': ['Android (Java)', 'Firebase'],
  // §7.23 — MPP #10 (source rank 7)
  'face-recognition-pipeline': ['Python', 'OpenCV'],
  // §7.23 — MPP #27 (source rank 7)
  'healthcare-desktop': ['Java', 'Swing', 'Maven'],
  // §7.23 — MPP #31 (source rank 7)
  'priority-request-manager': ['C'],
  // §7.23, D15 — MPP #30 (source rank 1, 7)
  'school-management-system': ['Java', 'OOP'],
  // §7.23, D15 — MPP #45 (source rank 1, 7)
  'myapps-demo': ['Android (Java)', 'WebView'],
} as const;

export type VerifiedTechSlug = keyof typeof VERIFIED_TECH;
