// The 11 roles for stage D and what each one asks for (brief 3, task D1).
// `npm run briefs:build` turns this into src/data/claims/role-briefs.ts by
// rule: whether a requirement lands in "direct" or "related" is decided by the
// builder from the claims' origin and strength and the skill tiers, never
// written here. Requirement wording is plain and generic; it names no
// technology that a cited claim does not name. Titles, aliases, lenses and the
// summary answers come from the assistant pack's role list.
import type { RoleSpec } from './role-brief-rules.ts';

export const roleSpecs: RoleSpec[] = [
  {
    slug: 'machine-learning-engineer',
    title: 'Machine Learning Engineer',
    alsoCalled: [
      'ML Engineer',
      'Machine Learning Developer',
      'Applied ML Engineer',
      'AI/ML Engineer',
    ],
    lens: 'aiml',
    answerId: 'qb-pitch-ml',
    askHim: ['qb-deployed-model', 'qb-too-good', 'qb-thesis'],
    requirements: [
      {
        text: 'Take a model from a scoped problem through data preparation, training, evaluation and handover',
        claims: ['career-dotpy', 'applied-ml-portfolio-lifecycle'],
        skills: ['feature engineering', 'cross-validation'],
      },
      {
        text: 'Build and compare models with PyTorch, scikit-learn and Hugging Face',
        claims: ['asc-pie-experiment-stack', 'career-graduate-researcher'],
        skills: ['PyTorch', 'scikit-learn', 'Hugging Face Transformers'],
      },
      {
        text: 'Fine-tune transformer models and measure them properly',
        claims: ['research-rq1', 'asc-pie-evaluation-framework'],
        skills: ['Transformers', 'benchmarking'],
      },
      {
        text: 'Prepare training data and check its quality',
        claims: ['asc-pie-dataset-pipeline', 'asc-pie-label-standardization'],
        skills: ['dataset construction', 'data validation'],
      },
      {
        text: 'Apply machine learning to many kinds of business problem',
        claims: ['applied-ml-portfolio-purpose', 'career-dotpy'],
        skills: ['regression', 'classification', 'clustering'],
      },
      {
        text: 'Treat unusually high scores as a reason to dig deeper',
        claims: [
          'cti-intrusion-detection-purpose',
          'page-what-mohamed-learned-cti-intrusion-detection',
        ],
      },
      {
        text: 'Package a model as a service other teams can call',
        claims: ['northstar-api-deployment', 'career-dotpy'],
        skills: ['Docker', 'FastAPI', 'model packaging and versioning'],
      },
      {
        text: 'Use cloud platforms for machine-learning work',
        claims: ['br-cloud'],
        skills: ['AWS', 'GCP'],
      },
      {
        text: 'Add vision and OCR to a machine-learning product',
        claims: ['minds-eye-ocr-speech', 'dive-ml-classification'],
        skills: ['OpenCV'],
        adjacent: true,
      },
    ],
  },
  {
    slug: 'nlp-engineer',
    title: 'NLP Engineer',
    alsoCalled: [
      'Natural Language Processing Engineer',
      'Information Extraction Engineer',
      'Text Analytics Engineer',
    ],
    lens: 'aiml',
    answerId: 'qb-pitch-ml',
    askHim: ['qb-thesis', 'qb-sprint-pp-privacy', 'qb-leakage'],
    requirements: [
      {
        text: 'Extract entities from unstructured text',
        claims: [
          'asc-pie-evaluation-framework',
          'asc-pie-label-standardization',
        ],
        skills: ['named-entity recognition', 'token classification'],
      },
      {
        text: 'Fine-tune transformer encoders for token classification',
        claims: ['research-rq1', 'asc-pie-experiment-stack'],
        skills: ['Transformers', 'Hugging Face Transformers'],
      },
      {
        text: 'Design one label schema across datasets that disagree',
        claims: ['asc-pie-label-standardization', 'stats-asc-pie'],
        skills: ['dataset construction'],
      },
      {
        text: 'Evaluate extraction at span level',
        claims: ['asc-pie-evaluation-framework', 'asc-pie-experiment-stack'],
        skills: ['span-level evaluation'],
      },
      {
        text: 'Compare fine-tuning with prompting for language models',
        claims: ['research-rq2', 'asc-pie-evaluation-framework'],
        skills: ['in-context learning'],
      },
      {
        text: 'Teach a model new entity types without forgetting the old ones',
        claims: ['sprint-pp-protocol', 'sprint-pp-results'],
        skills: ['class-incremental learning'],
      },
      {
        text: 'Classify sentiment and emotion in text',
        claims: ['career-dotpy', 'applied-ml-portfolio-purpose'],
        skills: ['sentiment analysis', 'emotion classification'],
      },
      {
        text: 'Build retrieval over documents with cited answers',
        claims: ['northstar-vector-retrieval', 'northstar-citations'],
        skills: ['RAG', 'Chroma'],
      },
      {
        text: 'Build a chatbot or question-answering interface',
        claims: ['this-portfolio-assistant'],
        skills: ['chatbots'],
        adjacent: true,
      },
    ],
  },
  {
    slug: 'document-ai-engineer',
    title: 'Document AI Engineer',
    alsoCalled: [
      'Document Intelligence Engineer',
      'Intelligent Document Processing Engineer',
      'Document Understanding Engineer',
    ],
    lens: 'aiml',
    answerId: 'qb-pitch-document-ai',
    askHim: ['qb-thesis', 'qb-sprint-pp-privacy', 'qb-proudest-project'],
    requirements: [
      {
        text: 'Turn PDFs and other documents into text a system can use',
        claims: ['northstar-ingestion-formats', 'northstar-chunking'],
        skills: ['PyMuPDF'],
      },
      {
        text: 'Run document workflows with intake, review and routing',
        claims: ['documentum-workflows-purpose', 'bass-document-workflows'],
        skills: ['OpenText Documentum', 'workflows'],
      },
      {
        text: 'Generate, assemble and transform PDFs',
        claims: ['pdf-utilities-purpose', 'pdf-utilities-stack'],
        skills: ['iText', 'PDF generation'],
      },
      {
        text: 'Detect personal information in text',
        claims: ['asc-pie-evaluation-framework', 'asc-pie-thesis-title'],
        skills: ['PII extraction'],
      },
      {
        text: 'Validate documents against rules and leave useful diagnostics',
        claims: ['bass-document-workflows', 'pdf-utilities-purpose'],
        skills: ['metadata validation', 'structured logging'],
      },
      {
        text: 'Apply retention and archival rules to documents',
        claims: ['documentum-workflows-purpose', 'career-bass'],
        skills: ['retention and archival'],
      },
      {
        text: 'Work where documents carry personal data',
        claims: ['career-bass', 'asc-pie-evaluation-framework'],
      },
      {
        text: 'Extract text from images with OCR',
        claims: ['minds-eye-ocr-speech'],
        skills: ['Tesseract'],
        adjacent: true,
      },
    ],
  },
  {
    slug: 'ai-llm-engineer',
    title: 'AI and LLM Engineer',
    alsoCalled: [
      'AI Engineer',
      'Applied AI Engineer',
      'LLM Engineer',
      'Generative AI Engineer',
      'RAG Engineer',
    ],
    lens: 'aiml',
    answerId: 'qb-pitch-llm',
    askHim: ['qb-evaluate-llm', 'qb-thesis', 'qb-did-not-work'],
    requirements: [
      {
        text: 'Build retrieval-augmented generation that cites its sources',
        claims: ['northstar-vector-retrieval', 'northstar-citations'],
        skills: ['RAG', 'Chroma', 'sentence-transformers'],
      },
      {
        text: 'Refuse rather than guess when the evidence is thin',
        claims: ['northstar-refusal-threshold'],
      },
      {
        text: 'Fine-tune and prompt open-weight language models and compare them',
        claims: ['research-rq2', 'asc-pie-evaluation-framework'],
        skills: ['in-context learning', 'instruction prompting'],
      },
      {
        text: 'Evaluate language-model output for correctness, validity and format',
        claims: [
          'asc-pie-evaluation-framework',
          'northstar-evaluation-testing',
        ],
        skills: ['LLM evaluation', 'benchmarking'],
      },
      {
        text: 'Expose an AI feature through a documented API',
        claims: ['northstar-api-deployment'],
        skills: ['FastAPI', 'Docker Compose', 'pytest'],
      },
      {
        text: 'Build a grounded assistant with guardrails',
        claims: ['this-portfolio-assistant', 'this-portfolio-purpose'],
        skills: ['chatbots'],
      },
      {
        text: 'Integrate hosted AI services into an application',
        claims: [
          'minds-eye-cloud-services',
          'dive-cloud-and-location-services',
        ],
        adjacent: true,
      },
    ],
  },
  {
    slug: 'ai-evaluation-engineer',
    title: 'AI Evaluation Engineer',
    alsoCalled: [
      'Model Evaluation Engineer',
      'LLM Evaluation Engineer',
      'Evals Engineer',
      'ML Benchmarking Engineer',
    ],
    lens: 'aiml',
    answerId: 'qb-pitch-evaluation',
    askHim: ['qb-evaluate-llm', 'qb-leakage', 'qb-too-good'],
    requirements: [
      {
        text: 'Design an evaluation framework with one protocol across model families',
        claims: ['asc-pie-evaluation-framework', 'asc-pie-dataset-pipeline'],
        skills: ['benchmarking', 'LLM evaluation'],
      },
      {
        text: 'Report strict and lenient scores together with output validity',
        claims: ['research-rq1', 'stats-asc-pie'],
        skills: ['span-level evaluation'],
      },
      {
        text: 'Study how the prompting setup changes results',
        claims: ['research-rq2'],
        skills: ['in-context learning'],
      },
      {
        text: 'Show which design choice moved the results',
        claims: ['research-rq4', 'stats-asc-pie'],
      },
      {
        text: 'Evaluate a retrieval system for faithfulness',
        claims: ['northstar-evaluation-testing'],
        skills: ['pytest'],
      },
      {
        text: 'Test a learning method against forgetting',
        claims: ['sprint-pp-protocol', 'sprint-pp-results'],
        skills: ['class-incremental learning'],
      },
      {
        text: 'Question results that look too good',
        claims: [
          'cti-intrusion-detection-purpose',
          'page-what-mohamed-learned-cti-intrusion-detection',
        ],
      },
      {
        text: 'Keep experiments reproducible',
        claims: ['career-graduate-researcher'],
        skills: ['reproducible experimentation'],
      },
    ],
  },
  {
    slug: 'privacy-engineer',
    title: 'Privacy and PII Engineer',
    alsoCalled: [
      'Privacy Engineer',
      'PII Detection Engineer',
      'Data Protection Engineer',
    ],
    lens: 'aiml',
    answerId: 'qb-pitch-document-ai',
    askHim: ['qb-sprint-pp-privacy', 'qb-thesis', 'qb-leakage'],
    requirements: [
      {
        text: 'Design a schema for personal-data types',
        claims: ['asc-pie-label-standardization', 'stats-asc-pie'],
        skills: ['PII extraction'],
      },
      {
        text: 'Detect personal data in text with trained models',
        claims: ['asc-pie-evaluation-framework', 'research-rq1'],
        skills: ['named-entity recognition'],
      },
      {
        text: 'Keep sensitive data out of model updates',
        claims: ['sprint-pp-results', 'sprint-pp-protocol'],
        skills: ['class-incremental learning'],
      },
      {
        text: 'Prepare real and synthetic datasets for privacy work',
        claims: ['asc-pie-dataset-pipeline'],
        skills: ['dataset construction'],
      },
      {
        text: 'Apply retention, archival and metadata controls',
        claims: ['documentum-workflows-purpose', 'career-bass'],
        skills: ['retention and archival', 'metadata validation'],
      },
      {
        text: 'Work where documents carry personal data',
        claims: ['bass-document-workflows', 'career-bass'],
      },
      {
        text: 'Publish privacy research for peer review',
        claims: ['sprint-pp-status', 'research-paper'],
      },
    ],
  },
  {
    slug: 'ai-solutions-engineer',
    title: 'AI Solutions Engineer',
    alsoCalled: [
      'Forward Deployed Engineer',
      'Solutions Engineer (AI)',
      'Implementation Engineer',
    ],
    lens: 'aiml',
    answerId: 'qb-pitch-solutions',
    askHim: ['qb-proudest-project', 'qb-through-line', 'qb-deployed-model'],
    requirements: [
      {
        text: 'Scope and deliver work for clients',
        claims: ['career-android-freelance', 'rest-pocs-purpose'],
      },
      {
        text: 'Build proofs of concept and demos against enterprise systems',
        claims: ['rest-pocs-purpose', 'rest-pocs-stack'],
      },
      {
        text: 'Define documented contracts between systems',
        claims: ['rest-pocs-purpose', 'bass-api-delivery'],
        skills: ['JSON schema design'],
      },
      {
        text: 'Hand technical work over to the team that uses it',
        claims: ['career-dotpy', 'applied-ml-portfolio-lifecycle'],
      },
      {
        text: 'Take a customer problem from question to working prototype',
        claims: [
          'applied-ml-portfolio-purpose',
          'applied-ml-portfolio-lifecycle',
        ],
      },
      {
        text: 'Support live systems for banking clients',
        claims: ['career-bass', 'documentum-workflows-purpose'],
        skills: ['production support'],
      },
      {
        text: 'Explain technical work to people outside the team',
        claims: ['teaching-delivery', 'career-private-instructor'],
        skills: ['mentoring', 'workshops'],
        adjacent: true,
      },
      {
        text: 'Work across research, backend, mobile and teaching',
        claims: ['br-startup-breadth'],
      },
    ],
  },
  {
    slug: 'documentum-ecm-consultant',
    title: 'OpenText Documentum and ECM Consultant',
    alsoCalled: [
      'Documentum Developer',
      'ECM Developer',
      'Content Management Consultant',
    ],
    lens: 'software',
    answerId: 'qb-pitch-ecm',
    askHim: ['qb-pitch-document-ai', 'qb-pitch-backend', 'qb-pitch-solutions'],
    requirements: [
      {
        text: 'Build Documentum workflows and lifecycles',
        claims: ['documentum-workflows-purpose', 'documentum-workflows-stack'],
        skills: ['OpenText Documentum', 'workflows', 'lifecycles'],
      },
      {
        text: 'Write DQL validation controls',
        claims: ['bass-document-workflows', 'documentum-workflows-stack'],
        skills: ['DQL', 'metadata validation'],
      },
      {
        text: 'Build with Documentum Composer',
        claims: ['documentum-workflows-stack'],
        skills: ['Documentum Composer'],
      },
      {
        text: 'Support production repositories for banking clients',
        claims: ['career-bass', 'documentum-workflows-purpose'],
        skills: ['production support'],
      },
      {
        text: 'Apply retention and archival policy',
        claims: ['documentum-workflows-purpose'],
        skills: ['retention and archival'],
      },
      {
        text: 'Generate and assemble PDFs for case files',
        claims: ['pdf-utilities-purpose', 'pdf-utilities-stack'],
        skills: ['iText'],
      },
      {
        text: 'Write Java utilities and services around the platform',
        claims: ['bass-java-services', 'pdf-utilities-stack'],
        skills: ['Java', 'Tomcat', 'Maven'],
      },
      {
        text: 'Connect the platform to other systems through APIs',
        claims: ['rest-pocs-purpose', 'bass-api-delivery'],
      },
    ],
  },
  {
    slug: 'java-backend-developer',
    title: 'Java Backend Developer',
    alsoCalled: [
      'Backend Developer (Java)',
      'Software Engineer (Java)',
      'Software Developer',
    ],
    lens: 'software',
    answerId: 'qb-pitch-backend',
    askHim: ['qb-pitch-ecm', 'qb-deployed-model', 'qb-did-not-work'],
    requirements: [
      {
        text: 'Build Java and Spring Boot services',
        claims: ['bass-java-services', 'rest-pocs-stack'],
        skills: ['Java', 'Spring Boot'],
      },
      {
        text: 'Design REST endpoints with documented JSON contracts',
        claims: ['rest-pocs-purpose', 'bass-api-delivery'],
        skills: ['JSON schema design'],
      },
      {
        text: 'Implement authentication',
        claims: ['cloud-backend-stack', 'rest-pocs-stack'],
        skills: ['authentication flows'],
      },
      {
        text: 'Work with relational databases',
        claims: ['documentum-workflows-stack', 'rest-pocs-stack'],
        skills: ['SQL', 'Microsoft SQL Server'],
      },
      {
        text: 'Log and diagnose services, and support them in production',
        claims: ['pdf-utilities-purpose', 'career-bass'],
        skills: [
          'structured logging',
          'production support',
          'root-cause analysis',
        ],
      },
      {
        text: 'Package Java services with Maven and run them on Tomcat',
        claims: ['pdf-utilities-stack'],
        skills: ['Maven', 'Tomcat'],
      },
      {
        text: 'Build an API with layered services',
        claims: ['cloud-backend-purpose', 'cloud-backend-stack'],
      },
      {
        text: 'Write Python services next to Java ones',
        claims: ['northstar-api-deployment', 'career-bass'],
        skills: ['FastAPI'],
      },
    ],
  },
  {
    slug: 'android-developer',
    title: 'Android Developer',
    alsoCalled: [
      'Android Engineer',
      'Mobile Developer (Android)',
      'Mobile ML Engineer',
    ],
    lens: 'android',
    answerId: 'qb-pitch-android',
    askHim: ['qb-proudest-project', 'qb-through-line', 'qb-deployed-model'],
    requirements: [
      {
        text: 'Ship native Android apps in Kotlin and Java',
        claims: ['career-android-freelance', 'weather-checker-stack'],
        skills: ['Android SDK', 'Kotlin', 'Java'],
      },
      {
        text: 'Structure apps with MVVM and repositories',
        claims: ['weather-checker-stack', 'dostava-android-architecture'],
        skills: ['MVVM'],
      },
      {
        text: 'Use Room, Retrofit and Firebase',
        claims: ['weather-checker-stack', 'dostava-firebase'],
        skills: ['Room/SQLite', 'Retrofit/OkHttp', 'Firebase'],
      },
      {
        text: 'Build offline-first apps with background sync',
        claims: ['career-android-freelance'],
        skills: ['offline-first', 'background sync'],
      },
      {
        text: 'Test view models against fake data sources',
        claims: ['stats-weather-checker', 'weather-checker-stack'],
        skills: ['JUnit'],
      },
      {
        text: 'Release through the Play Console',
        claims: ['career-android-freelance'],
        skills: ['Play Console', 'app signing and staged rollout'],
      },
      {
        text: 'Add maps, location and notifications',
        claims: ['career-android-freelance', 'weather-checker-purpose'],
        skills: ['Maps and Location', 'push notifications'],
      },
      {
        text: 'Bring OCR, vision and machine learning into a mobile app',
        claims: ['br-mobile-ml', 'minds-eye-ocr-speech'],
      },
      {
        text: 'Build declarative interfaces with Jetpack Compose',
        claims: ['skills-android-exposure'],
        skills: ['Jetpack Compose'],
      },
    ],
  },
  {
    slug: 'technical-instructor',
    title: 'Technical Instructor',
    alsoCalled: [
      'Teaching Assistant',
      'Technical Trainer',
      'Sessional Instructor',
      'Lab Instructor',
    ],
    lens: 'teaching',
    answerId: 'qb-pitch-teaching',
    askHim: ['qb-through-line', 'qb-proudest-project', 'qb-thesis'],
    requirements: [
      {
        text: 'Lead labs, tutorials and office hours',
        claims: ['career-york-ta', 'teaching-delivery'],
        skills: ['lab and tutorial facilitation'],
      },
      {
        text: 'Teach programming to university and adult learners',
        claims: ['career-private-instructor', 'teaching-computing-topics'],
      },
      {
        text: 'Run workshops and coding clinics',
        claims: ['teaching-portfolio-1'],
        skills: ['workshops'],
      },
      {
        text: 'Write reusable lab exercises with automated tests',
        claims: ['teaching-portfolio-2'],
      },
      {
        text: 'Prepare problem sets, mock exams and walkthroughs',
        claims: ['career-private-instructor', 'career-york-ta'],
      },
      {
        text: 'Teach machine-learning fundamentals with notebooks',
        claims: ['teaching-ai-ml', 'teaching-portfolio-3'],
      },
      {
        text: 'Assess work against shared rubrics',
        claims: ['career-york-ta'],
      },
      {
        text: 'Mentor junior developers',
        claims: ['career-dotpy'],
        skills: ['mentoring'],
      },
      {
        text: 'Create demos and learning material for developers',
        claims: ['teaching-portfolio-4', 'teaching-portfolio-1'],
        adjacent: true,
      },
    ],
  },
];
