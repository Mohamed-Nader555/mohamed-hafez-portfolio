import type { RoleId } from '@/types/content';

export type RoleWeights = Record<RoleId, number>;

export interface CareerRoleContent {
  eyebrow: string;
  hero: string;
  summary: string;
  skillOrder: readonly string[];
}

export const careerRoles: Record<RoleId, CareerRoleContent> = {
  aiml: {
    eyebrow: 'AI/ML Engineer',
    hero: 'I build production LLM and real-time voice AI, backed by privacy-aware NLP research and careful evaluation.',
    summary:
      'As Founding AI Engineer at Eklan, I build the AI behind an English-communication training platform for healthcare professionals: real-time voice roleplay on the Gemini Live API, a multi-character mode where a director model routes speech between AI characters, a five-stage speech grading pipeline, an on-demand AI coach with structured outputs and an eval suite, and composed prompts for personalized drills. Before Eklan, I built end-to-end ML and NLP pipelines for information extraction, named-entity recognition, retrieval-augmented generation, and model evaluation. My work spans dataset construction, preprocessing, fine-tuning, inference, benchmarking, and reproducible experimentation across encoder, encoder-decoder, and decoder-only architectures. My M.A. research at York University produced ASC-PIE and the SPRINT-PP method, while my applied work includes more than ten ML projects and ML-integrated mobile systems.',
    skillOrder: [
      'ai-llm',
      'machine-learning',
      'nlp-llms',
      'languages',
      'web-backend',
      'data-cloud',
      'data-mlops',
      'computer-vision',
      'cloud',
      'backend',
      'databases',
    ],
  },
  software: {
    eyebrow: 'Software Engineer',
    hero: 'I ship full-stack TypeScript on Next.js, MongoDB and Vercel, and design reliable services, APIs and enterprise workflows.',
    summary:
      'At Eklan, I own AI product features end to end in TypeScript: Next.js route handlers and React UI, MongoDB models and indexes, background job queues with leases and retries, PostHog analytics, and feature-flagged releases from staging to production on Vercel. Before that, I developed Java- and Python-based services, REST APIs, enterprise content workflows, and document-processing utilities. I have worked across requirements, implementation, testing, debugging, performance tuning, documentation, and production support with Spring Boot, FastAPI, Tomcat, SQL/DQL, OpenText Documentum, iText, structured logging, and PII-aware document handling.',
    skillOrder: [
      'languages',
      'web-backend',
      'data-cloud',
      'ai-llm',
      'backend',
      'tools',
      'ecm',
      'databases',
      'document-processing',
      'data-mlops',
      'cloud',
    ],
  },
  android: {
    eyebrow: 'Android Developer',
    hero: 'I create Android products that connect clean mobile architecture with APIs, offline data, maps, Firebase, and applied ML.',
    summary:
      'I have delivered 9 Android applications across delivery, wellbeing, weather, e-commerce, sports, utilities, safety, education, community, and gaming. Four were previously published through client-owned Google Play listings that are no longer maintained: Dostava, Your Life Is My Life, The Death Ninja and Search for Eats. My work covers Kotlin and Java, MVVM/MVP, Jetpack, Retrofit/OkHttp, Room/SQLite, Firebase, Maps and Location, background work, release workflows, and integrations involving OCR, computer vision, and API-based ML.',
    skillOrder: [
      'android',
      'mobile-integration',
      'mobile-release',
      'languages',
      'computer-vision',
      'backend',
      'databases',
      'tools',
    ],
  },
  teaching: {
    eyebrow: 'TA / Instructor',
    hero: 'I turn difficult technical ideas into practical labs, workshops, assignments, and explanations people can use.',
    summary:
      'I have supported undergraduate courses at York University in Data Visualization and Systems Architecture and delivered more than 200 hours of private instruction. My teaching covers data structures, algorithms, Java and OOP, AI/ML fundamentals, Android development, lab facilitation, office hours, rubric-based grading, tutorial design, debugging, and technical mentoring across students from six institutions.',
    skillOrder: [
      'professional',
      'languages',
      'visualization',
      'machine-learning',
      'android',
      'tools',
      'nlp-llms',
      'computer-vision',
    ],
  },
};

export const proofStats = [
  { value: '9', label: 'Android apps delivered (client or team releases)' },
  { value: '4', label: 'Previously on Google Play (client-owned listings)' },
  { value: '10+', label: 'Applied ML projects' },
  { value: '200+', label: 'Teaching hours' },
  { value: '3.72', label: 'Undergraduate GPA' },
] as const;

export const careerExperience = [
  {
    id: 'eklan',
    current: true,
    period: 'Sep 2026 – present',
    title: 'Founding AI Engineer',
    organization: 'Eklan · Toronto',
    blurb:
      'AI communication-training platform for healthcare professionals (training software, not clinical).',
    details: [
      'I own AI features end to end on a small founding team: TypeScript, Node.js and Next.js APIs, MongoDB, a React UI, evaluation, and feature-flagged CI/CD from staging to production.',
      'I built real-time conversational voice AI on Gemini Live: browser audio streaming, short-lived config-locked session tokens, voice-activity tuning, interruption handling, and function calling that drives the phases of a session.',
      'I built a multi-agent conversation system: one live session per agent, a director model that routes each turn, guardrails and a safe fallback. Built and load-tested.',
      'I built a multi-stage LLM evaluation pipeline (transcription, pronunciation, LLM language and communication grading, coaching feedback) with retries, model fallback on rate limits, per-stage error reasons and a re-grading consistency check.',
      'I built an on-demand AI copilot with structured outputs against versioned schemas, versioned prompts, rule-based checks, and English and Korean PII redaction before storage, tested against the live model.',
      'I built a test harness for voice agents (synthetic user audio, latency and turn-taking checks, LLM-as-judge) and set up observability with Sentry, PostHog and Vercel logs. I work with a spec-driven agentic workflow using Claude Code and MCP connectors (used, not built).',
    ],
    detailsByRole: {
      aiml: null,
      software: [
        'I own features end to end on a small founding team: TypeScript and Next.js APIs, React UI, MongoDB models and indexes, PostHog analytics, and feature-flagged releases from staging to production on Vercel.',
        'I built the backend of an on-demand AI coach: Next.js route handlers, Zod-validated structured outputs, MongoDB unique indexes so retries never create duplicates, and a leased job queue with backoff that a Vercel cron sweeps every minute.',
        'I moved live voice roleplay from a server relay to direct streaming from the browser to the Gemini Live API over WebSockets, with the server issuing short-lived tokens that lock the model, instructions and voice, and a Web Audio and AudioWorklet engine in the browser.',
        'I built a 5-stage speech grading pipeline that runs in the background during the call with Next.js after(), stores each part’s status, attempts and error reason in MongoDB, and falls back to a second model on rate limits.',
        'I planned MongoDB Atlas indexes for a production setup with auto-indexing off, wrote index scripts checked by read-only queries before release, and shipped through staging and production pull requests with a rollback plan for every release.',
      ],
      android: [
        'At Eklan, an English-communication training platform for healthcare professionals, I build the AI product features (real-time voice roleplay, speech grading and an AI coach) in TypeScript and Next.js.',
      ],
      teaching: [
        'At Eklan, an English-communication training platform for healthcare professionals, I build the AI practice around live tutor-led classes: voice roleplay, speech feedback, and tutor tools that turn class transcripts into targeted drills.',
      ],
    },
    sourceIds: ['public-experience'],
    weights: { aiml: 5, software: 5, android: 1, teaching: 1 },
  },
  {
    id: 'graduate-researcher',
    period: 'Sep 2024 – Apr 2026',
    title: 'Graduate Researcher — Machine Learning & NLP',
    organization: 'York University · CERAS Lab · Toronto',
    details: [
      'I designed end-to-end ML/NLP pipelines for privacy-aware information extraction using Python, PyTorch, and Hugging Face.',
      'I built ASC-PIE, standardized heterogeneous datasets under a shared 19-entity schema, benchmarked multiple model families, and developed the privacy-safe SPRINT-PP continual-learning method.',
      'I created reproducible research artifacts covering schemas, prompts, configurations, evaluation summaries, and prediction traces.',
    ],
    weights: { aiml: 5, software: 2, android: 0, teaching: 2 },
  },
  {
    id: 'bass',
    period: 'Aug 2023 – Sep 2024',
    title: 'Software Engineer — ECM Consultant',
    organization: 'BASS · Cairo',
    details: [
      'I implemented and supported OpenText Documentum workflows for document intake, review, routing, archival, and retention in regulated environments.',
      'I built Java and Python utilities, REST prototypes, DQL validation controls, PDF-processing workflows, and structured diagnostics for production support.',
    ],
    weights: { aiml: 1, software: 5, android: 0, teaching: 1 },
  },
  {
    id: 'dotpy',
    period: 'Jun 2021 – Aug 2023',
    title: 'AI & ML Specialist',
    organization: 'DotPy · Cairo',
    details: [
      'I delivered applied ML projects across forecasting, segmentation, recommendation, sentiment analysis, fraud detection, and image classification.',
      'I owned workflows from problem definition and data preparation through evaluation, API or Docker packaging, documentation, and technical handover.',
      'I also designed AI/ML, data-science, Python, and mobile-integration workshops and mentored junior developers.',
    ],
    weights: { aiml: 5, software: 3, android: 1, teaching: 3 },
  },
  {
    id: 'android-freelance',
    period: 'Jul 2019 – Jun 2024',
    title: 'Freelance Android Developer',
    organization: 'Client projects · Remote',
    details: [
      'I delivered 9 Android applications (a delivered app is one handed to a client or released with a team) using Kotlin and Java, MVVM/MVP, Retrofit, Room, WorkManager, Firebase, Maps, notifications, and offline-first data flows.',
      'Four apps were previously published through client-owned Google Play listings that are no longer maintained: Dostava, Your Life Is My Life, The Death Ninja and Search for Eats.',
      'I integrated OCR, computer vision, API-based ML, text-to-speech, and location-aware workflows into mobile experiences.',
    ],
    weights: { aiml: 1, software: 2, android: 5, teaching: 1 },
  },
  {
    id: 'private-instructor',
    period: 'Jan 2023 – Aug 2024',
    title: 'Private Instructor — Computer Science & Software Development',
    organization: 'Independent · Cairo',
    details: [
      'I delivered more than 200 hours across 40+ individual and small-group sessions in data structures, algorithms, Java/OOP, AI/ML, and Android.',
      'I supported students from six institutions and created 30+ problem sets, 10+ mock examinations, walkthroughs, and structured study plans.',
    ],
    weights: { aiml: 1, software: 2, android: 2, teaching: 5 },
  },
  {
    id: 'java-freelance',
    period: 'Sep 2019 – Jun 2023',
    title: 'Freelance Java Developer',
    organization: 'Client projects · Remote',
    details: [
      'I worked across design, development, debugging, testing, and documentation for client Java applications.',
      'Projects included a restaurant-management application and a networked Tic-Tac-Toe game using client/server sockets.',
    ],
    weights: { aiml: 0, software: 4, android: 1, teaching: 2 },
  },
  {
    id: 'york-ta',
    period: 'Sep 2024 – Apr 2026',
    title: 'Teaching Assistant — Data Visualization & Systems Architecture',
    organization: 'York University · Toronto',
    details: [
      'I led labs, tutorials, and office hours covering visualization, architecture, object-oriented design, design patterns, debugging, and code quality.',
      'I assessed assignments and examinations using shared rubrics and prepared walkthroughs and student-support materials.',
    ],
    weights: { aiml: 1, software: 1, android: 0, teaching: 5 },
  },
] as const;

export const skillGroups = [
  {
    id: 'ai-llm',
    label: 'AI / LLM',
    skills:
      'Gemini Live API · OpenAI GPT · prompt engineering · structured outputs · function calling · multi-agent orchestration · LLM evaluation · LLM-as-judge · guardrails · PII redaction · speech-to-text · TTS (ElevenLabs) · pronunciation scoring (SpeechAce)',
  },
  {
    id: 'languages',
    label: 'Programming languages',
    skills:
      'TypeScript · JavaScript · Python · SQL · Java · Kotlin · C · C++ · C# · Dart · PHP · HTML/CSS · Bash · XML',
  },
  {
    id: 'web-backend',
    label: 'Web and backend',
    skills:
      'Next.js · React · Node.js · REST APIs · WebSockets · Web Audio / AudioWorklet · Tailwind CSS · Zod',
  },
  {
    id: 'data-cloud',
    label: 'Data and cloud',
    skills:
      'MongoDB Atlas · Mongoose · Vercel (serverless, cron) · Cloudinary · PostHog · Sentry · Docker',
  },
  {
    id: 'machine-learning',
    label: 'Machine learning',
    skills:
      'PyTorch · TensorFlow · scikit-learn · pandas · NumPy · feature engineering · cross-validation · classification · clustering · recommendation',
  },
  {
    id: 'nlp-llms',
    label: 'NLP & LLMs',
    skills:
      'NER · token classification · Transformers · Hugging Face · fine-tuning · RAG · prompting · in-context learning · LLM evaluation · continual learning',
  },
  {
    id: 'computer-vision',
    label: 'Computer vision & OCR',
    skills:
      'OpenCV · Tesseract OCR · image processing · CNNs · transfer learning · API inference · text-to-speech',
  },
  {
    id: 'data-mlops',
    label: 'Data & MLOps',
    skills:
      'dataset construction · validation · experiment tracking · model packaging · Docker · CI/CD · regression testing · code review',
  },
  {
    id: 'android',
    label: 'Android',
    skills:
      'Android SDK · Kotlin · Java · Jetpack Compose · MVVM/MVP · Clean Architecture · Room · WorkManager · Coroutines · Hilt/Dagger',
  },
  {
    id: 'mobile-integration',
    label: 'Mobile integration',
    skills:
      'Retrofit · OkHttp · REST/JSON · Firebase · FCM · Maps/Location · authentication · offline caching · background synchronization',
  },
  {
    id: 'mobile-release',
    label: 'Mobile test & release',
    skills:
      'Gradle · JUnit · Mockito · Espresso · Robolectric · AAB/APK · signing · Play Console · staged rollout · crash/ANR triage',
  },
  {
    id: 'backend',
    label: 'Java and Python backend',
    skills:
      'Spring Boot · FastAPI · Flask · Tomcat · Maven · REST APIs · authentication · JDBC · structured logging · production support',
  },
  {
    id: 'ecm',
    label: 'Enterprise content management',
    skills:
      'OpenText Documentum · Content Server · Composer · DQL · workflows · lifecycles · metadata validation · retention · archival',
  },
  {
    id: 'document-processing',
    label: 'Document processing',
    skills:
      'iText · PDF generation · assembly · transformation · packaging · log4j · failure diagnostics',
  },
  {
    id: 'databases',
    label: 'Databases',
    skills:
      'MS SQL Server · SQLite · Room · relational modelling · query optimization · SQL/DQL · persistent mobile storage',
  },
  {
    id: 'cloud',
    label: 'Cloud & platforms',
    skills:
      'AWS · SageMaker · Google Cloud · Azure · Linux · Jupyter · Colab · Databricks · Spark',
  },
  {
    id: 'visualization',
    label: 'Visualization',
    skills: 'matplotlib · seaborn · Power BI · Tableau · pandas/NumPy analysis',
  },
  {
    id: 'tools',
    label: 'Engineering tools',
    skills:
      'Git · GitHub · Claude Code · MCP · VS Code · CI/CD · feature flags · GitHub Actions · IntelliJ · Eclipse · Conda · Arduino · PlantUML · draw.io · LaTeX',
  },
  {
    id: 'professional',
    label: 'Professional strengths',
    skills:
      'communication · problem solving · mentoring · stakeholder management · documentation · presentation · research · adaptability',
  },
] as const;

export const teachingPortfolio = [
  {
    period: '2019 – 2024',
    title: 'Workshops & coding clinics',
    organization:
      'CIC · DotPy Academy · Minders · Google Developer Student Club · Most Electronics',
    detail:
      'I delivered 15+ workshops and coding clinics to 100+ attendees across data structures, C/C++, problem solving, Java/OOP, AI/ML, data science, and introductory Android development.',
  },
  {
    period: '2019 – 2026',
    title: 'Data Structures Lab Series',
    organization: 'Reusable instructional materials',
    detail:
      'Six core topics, 12+ lab exercises, 30+ automated test cases, complexity notes, and solution walkthroughs.',
  },
  {
    period: '2019 – 2026',
    title: 'Intro AI/ML Notebooks & Assignments',
    organization: 'Reusable instructional materials',
    detail:
      '10+ notebooks with answer keys covering classification, regression, evaluation, introductory NLP, computer vision, and data-quality practice.',
  },
  {
    period: '2019 – 2026',
    title: 'Android teaching mini-apps',
    organization: 'Reusable instructional materials',
    detail:
      'Three or more applications demonstrating networking, local storage, architecture patterns, offline behaviour, and UI construction.',
  },
] as const;

export const education = [
  {
    period: '2024 – 2026',
    credential: 'M.A. Information Systems & Technology',
    institution: 'York University · Toronto',
    details: [
      'Completed and officially awarded in 2026.',
      'Thesis: ASC-PIE: An Evaluation Framework for PII-Aware Named-Entity Recognition.',
      'Research focus: privacy-aware NLP, named-entity recognition, LLM evaluation, and continual learning.',
    ],
  },
  {
    period: '2018 – 2022',
    credential: 'B.Sc. Computer Science & Artificial Intelligence',
    institution: 'Helwan University · Cairo',
    details: [
      'Excellent with Honors · ranked 2nd in class · GPA 3.72/4.0.',
      'Computer Science major with Information Systems minor.',
      'Capstone grade A+: Mind’s Eye assistive smart-glasses system.',
    ],
  },
  {
    period: '2023',
    credential: 'Professional Certificate — Mobile Application Development',
    institution: 'Information Technology Institute (ITI) · Smart Village',
    details: [
      'Intensive Android engineering track covering UI, networking, local storage, MVVM/MVP, Git, code review, and project delivery.',
    ],
  },
] as const;

export const credentials = [
  ['AWS Machine Learning Foundations', 'Udacity · Certificate · 2022'],
  ['Artificial Intelligence Foundations', 'DotPy · Certificate · 2021'],
  ['Android Development', 'Udemy · Certificate'],
  [
    'Android Development Track',
    'One Million Arab Coders / Udacity · Certificate · 2019',
  ],
  ['Introduction to Android Diploma', 'Reload Academy · Certificate · 2018'],
  [
    'Certified Ethical Hacker (CEH)',
    'Inspire Academy · Training programme only · 2022',
  ],
  ['AI & Machine Learning Workshop', 'DotPy · Workshop · 2020'],
  ['Problem Solving Workshop', 'Minders · Workshop · 2020'],
  [
    'Soft Skills Workshop',
    'Microsoft Student Partner Programme · Workshop · 2019',
  ],
] as const;

export const awards = [
  [
    'Excellent with Honors · ranked 2nd in graduating class',
    'Helwan University · 2022',
  ],
  ['Capstone grade A+ · Mind’s Eye', 'Helwan University · 2022'],
  ['ICPC contestant · three consecutive years', '2019 · 2020 · 2021'],
] as const;

/** Career details for a focus: its own list when it has one, else the default. */
export function careerDetailsFor(
  entry: (typeof careerExperience)[number],
  role: RoleId,
): readonly string[] {
  if ('detailsByRole' in entry)
    return entry.detailsByRole[role] ?? entry.details;
  return entry.details;
}

/** Every distinct career line for an entry, across all focuses. */
export function allCareerDetails(
  entry: (typeof careerExperience)[number],
): string[] {
  const lists =
    'detailsByRole' in entry
      ? [entry.details, ...Object.values(entry.detailsByRole)]
      : [entry.details];
  return [...new Set(lists.flatMap((list) => list ?? []))];
}

/**
 * Experience in the order a focus shows it: the current role always first,
 * then the rest ranked by how much they matter to that focus.
 */
export function careerForRole(role: RoleId) {
  const current = careerExperience.filter((entry) => 'current' in entry);
  const rest = careerExperience.filter((entry) => !('current' in entry));
  return [...current, ...roleRank(rest, role)];
}

export function roleRank<T extends { weights: RoleWeights }>(
  items: readonly T[],
  role: RoleId,
): T[] {
  return [...items].sort((a, b) => b.weights[role] - a.weights[role]);
}
