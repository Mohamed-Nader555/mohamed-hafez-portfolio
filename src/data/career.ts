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
    hero: 'I build privacy-aware NLP, grounded AI, and reproducible machine-learning systems from research through deployment.',
    summary:
      'I build end-to-end ML and NLP pipelines for information extraction, named-entity recognition, retrieval-augmented generation, and model evaluation. My work spans dataset construction, preprocessing, fine-tuning, inference, benchmarking, and reproducible experimentation across encoder, encoder-decoder, and decoder-only architectures. My M.A. research at York University produced ASC-PIE and the SPRINT-PP method, while my applied work includes more than ten ML projects and ML-integrated mobile systems.',
    skillOrder: [
      'machine-learning',
      'nlp-llms',
      'data-mlops',
      'languages',
      'computer-vision',
      'cloud',
      'backend',
      'databases',
    ],
  },
  software: {
    eyebrow: 'Software Engineer',
    hero: 'I design reliable services, APIs, enterprise workflows, and client products from architecture through production support.',
    summary:
      'I develop Java- and Python-based services, REST APIs, enterprise content workflows, and document-processing utilities. I have worked across requirements, implementation, testing, debugging, performance tuning, documentation, and production support with Spring Boot, FastAPI, Tomcat, SQL/DQL, OpenText Documentum, iText, structured logging, and PII-aware document handling.',
    skillOrder: [
      'languages',
      'backend',
      'ecm',
      'document-processing',
      'databases',
      'data-mlops',
      'cloud',
      'tools',
    ],
  },
  android: {
    eyebrow: 'Android Developer',
    hero: 'I create Android products that connect clean mobile architecture with APIs, offline data, maps, Firebase, and applied ML.',
    summary:
      'I have delivered 16 Android applications across delivery, wellbeing, weather, e-commerce, sports, utilities, safety, education, community, and gaming. Four were previously published on Google Play: three under client-owned listings and one as part of my ITI training. My work covers Kotlin and Java, MVVM/MVP, Jetpack, Retrofit/OkHttp, Room/SQLite, Firebase, Maps and Location, background work, release workflows, and integrations involving OCR, computer vision, and API-based ML.',
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
  { value: '16', label: 'Android apps delivered' },
  { value: '4', label: 'Previously shipped to Google Play' },
  { value: '10+', label: 'Applied ML projects' },
  { value: '200+', label: 'Teaching hours' },
  { value: '3.72', label: 'Undergraduate GPA' },
] as const;

export const careerExperience = [
  {
    id: 'graduate-researcher',
    period: 'Sep 2024 — Apr 2026',
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
    period: 'Aug 2023 — Sep 2024',
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
    period: 'Jun 2021 — Aug 2023',
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
    period: 'Jul 2019 — Jun 2024',
    title: 'Freelance Android Developer',
    organization: 'Client projects · Remote',
    details: [
      'I delivered 16 Android applications using Kotlin and Java, MVVM/MVP, Retrofit, Room, WorkManager, Firebase, Maps, notifications, and offline-first data flows.',
      'Four apps were previously published on Google Play: three under client-owned listings, no longer maintained by the clients, and one as part of my ITI training.',
      'I integrated OCR, computer vision, API-based ML, text-to-speech, and location-aware workflows into mobile experiences.',
    ],
    weights: { aiml: 1, software: 2, android: 5, teaching: 1 },
  },
  {
    id: 'private-instructor',
    period: 'Jan 2023 — Aug 2024',
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
    period: 'Sep 2019 — Jun 2023',
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
    period: 'Sep 2024 — Apr 2026',
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
    id: 'languages',
    label: 'Programming languages',
    skills:
      'Python · Java · Kotlin · SQL · C · C++ · C# · Dart · JavaScript · PHP · HTML/CSS · Bash · XML',
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
      'NER · token classification · Transformers · Hugging Face · RAG · prompting · in-context learning · LLM evaluation · continual learning',
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
    label: 'Backend',
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
      'Git · GitHub Actions · VS Code · IntelliJ · Eclipse · Conda · Arduino · PlantUML · draw.io · LaTeX',
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
    period: '2019 — 2024',
    title: 'Workshops & coding clinics',
    organization:
      'CIC · DotPy Academy · Minders · Google Developer Student Club · Most Electronics',
    detail:
      'I delivered 15+ workshops and coding clinics to 100+ attendees across data structures, C/C++, problem solving, Java/OOP, AI/ML, data science, and introductory Android development.',
  },
  {
    period: '2019 — 2026',
    title: 'Data Structures Lab Series',
    organization: 'Reusable instructional materials',
    detail:
      'Six core topics, 12+ lab exercises, 30+ automated test cases, complexity notes, and solution walkthroughs.',
  },
  {
    period: '2019 — 2026',
    title: 'Intro AI/ML Notebooks & Assignments',
    organization: 'Reusable instructional materials',
    detail:
      '10+ notebooks with answer keys covering classification, regression, evaluation, introductory NLP, computer vision, and data-quality practice.',
  },
  {
    period: '2019 — 2026',
    title: 'Android teaching mini-apps',
    organization: 'Reusable instructional materials',
    detail:
      'Three or more applications demonstrating networking, local storage, architecture patterns, offline behaviour, and UI construction.',
  },
] as const;

export const education = [
  {
    period: '2024 — 2026',
    credential: 'M.A. Information Systems & Technology',
    institution: 'York University · Toronto',
    details: [
      'Completed and officially awarded in 2026.',
      'Thesis: ASC-PIE: An Evaluation Framework for PII-Aware Named-Entity Recognition.',
      'Research focus: privacy-aware NLP, named-entity recognition, LLM evaluation, and continual learning.',
    ],
  },
  {
    period: '2018 — 2022',
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

export function roleRank<T extends { weights: RoleWeights }>(
  items: readonly T[],
  role: RoleId,
): T[] {
  return [...items].sort((a, b) => b.weights[role] - a.weights[role]);
}
