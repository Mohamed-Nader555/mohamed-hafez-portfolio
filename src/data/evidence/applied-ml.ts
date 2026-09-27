import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const records = [
  {
    id: 'applied-ml-portfolio-purpose',
    title: 'Applied ML portfolio purpose',
    statement:
      'At DotPy (2021–2023), I delivered more than ten applied machine-learning projects across forecasting, segmentation, recommendation, sentiment analysis, fraud detection, and image classification. Project-level dataset names and metrics were not preserved.',
    topics: ['applied machine learning', 'DotPy', 'delivery'],
    aliases: ['Applied Machine Learning Portfolio'],
    roleWeights: { aiml: 5, software: 2, android: 0, teaching: 2 },
    sourceIds: ['resume-aiml', 'public-experience', 'case-study-applied-ml-portfolio'],
    public: true,
  },
  {
    id: 'applied-ml-portfolio-lifecycle',
    title: 'Applied ML delivery lifecycle',
    statement:
      'Each applied ML project moved through scoping, data preparation, feature engineering, model selection, evaluation, and delivery as a notebook, API, or Docker package, with documentation and handover.',
    topics: ['Python', 'pandas', 'scikit-learn', 'TensorFlow', 'PyTorch', 'Docker'],
    aliases: ['ML delivery pipeline'],
    roleWeights: { aiml: 5, software: 2, android: 0, teaching: 1 },
    sourceIds: ['resume-aiml', 'case-study-applied-ml-portfolio'],
    public: true,
  },
  {
    id: 'cti-intrusion-detection-purpose',
    title: 'Intrusion detection pipeline purpose',
    statement:
      'As a 2025 course project, I built a network intrusion-detection pipeline comparing model families on benign versus DoS/DDoS flow data, pruning correlated features to about 63 before a stratified 80/20 split.',
    topics: ['intrusion detection', 'course project', 'network security'],
    aliases: ['Network Intrusion Detection Pipeline', 'CTI'],
    roleWeights: { aiml: 5, software: 1, android: 0, teaching: 1 },
    sourceIds: ['resume-aiml', 'case-study-cti-intrusion-detection'],
    public: true,
  },
  {
    id: 'cti-intrusion-detection-results',
    title: 'Intrusion detection results and caveat',
    statement:
      'Logistic Regression scored roughly 0.67 ROC-AUC, while Random Forest, Gradient Boosting, and a Keras ANN scored near 0.99–1.00. The near-perfect tree-ensemble scores are flagged as a possible sign of leakage or overfitting, recommending time-based or cross-capture validation rather than being reported as a success.',
    topics: ['ROC-AUC', 'overfitting', 'validation', 'random forest'],
    aliases: ['intrusion detection accuracy'],
    roleWeights: { aiml: 5, software: 1, android: 0, teaching: 1 },
    sourceIds: ['resume-aiml', 'case-study-cti-intrusion-detection'],
    public: true,
  },
  {
    id: 'face-recognition-pipeline-purpose',
    title: 'Face recognition learning pipeline',
    statement:
      'I built a three-step OpenCV face-recognition pipeline (capture, train, recognise) in Python as a self-contained learning project.',
    topics: ['face recognition', 'OpenCV', 'learning project'],
    aliases: ['Face Recognition Learning Pipeline'],
    roleWeights: { aiml: 3, software: 1, android: 0, teaching: 1 },
    sourceIds: ['resume-aiml'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const appliedMlEvidence = evidenceRecordSchema.array().parse(records);
