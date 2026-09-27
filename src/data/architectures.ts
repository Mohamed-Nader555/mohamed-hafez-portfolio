/**
 * Case-study architecture definitions, keyed by project id. Rendered by
 * `ArchitectureFlow.astro`. Source: PROJECTS_REWRITE_BRIEF.md §6.6.
 */
export interface ArchitectureNode {
  id: string;
  label: string;
  detail: string;
}

export interface ArchitectureEdge {
  from: string;
  to: string;
  label?: string;
}

export interface ArchitectureDefinition {
  summary: string;
  nodes: readonly ArchitectureNode[];
  edges: readonly ArchitectureEdge[];
  /** Short stage names for the monospace pipeline strip, in order. */
  pipeline?: readonly string[];
}

export const architectures: Readonly<Record<string, ArchitectureDefinition>> = {
  'asc-pie': {
    summary:
      'Four public corpora and a synthetic component are mapped to a shared 19-type schema, split once, exported in three formats, and scored through one canonical evaluator across three model families.',
    nodes: [
      { id: 'data-sources', label: 'Data sources', detail: '4 public corpora + synthetic augmentation' },
      { id: 'schema-mapping', label: 'Schema mapping', detail: '19-type schema, IOB2 repair, dedup' },
      { id: 'fixed-splits', label: 'Fixed splits', detail: '312,085 / 10,512 / 10,512' },
      { id: 'synced-exports', label: 'Synced exports', detail: 'IOB2 · key-value · JSON' },
      { id: 'model-families', label: 'Model families', detail: 'Encoder · encoder-decoder · decoder-only; fine-tuning or ICL' },
      { id: 'canonical-parser', label: 'Canonical parser', detail: '(type, text) pairs' },
      { id: 'shared-evaluator', label: 'Shared evaluator', detail: 'Strict/normalized F1, validity, latency' },
    ],
    edges: [
      { from: 'data-sources', to: 'schema-mapping' },
      { from: 'schema-mapping', to: 'fixed-splits' },
      { from: 'fixed-splits', to: 'synced-exports' },
      { from: 'synced-exports', to: 'model-families' },
      { from: 'model-families', to: 'canonical-parser' },
      { from: 'canonical-parser', to: 'shared-evaluator' },
    ],
    pipeline: ['sources', 'schema', 'splits', 'exports', 'models', 'parser', 'evaluator'],
  },
  'sprint-pp': {
    summary:
      'Each new stage is checked for suspected old entities by the frozen previous model, corrected with soft labels and a prototype memory instead of raw replay, and anchored so the classifier keeps its old rows.',
    nodes: [
      { id: 'stage-data', label: 'Stage t data', detail: 'New-stage labelled text, old types now O' },
      { id: 'student', label: 'Student model', detail: 'RoBERTa-large, updated on stage t' },
      { id: 'teacher', label: 'Teacher model', detail: 'Frozen copy of the previous stage' },
      { id: 'triage', label: 'Triage', detail: 'Scores O-labelled tokens; above τ → suspected old entity' },
      { id: 'correction', label: 'Selective correction', detail: 'Soft-label guidance for routed tokens only' },
      { id: 'prototype-memory', label: 'Prototype memory', detail: 'One centroid per old type, no raw text' },
      { id: 'head-anchor', label: 'Head anchoring', detail: 'Classifier rows for old labels are stabilized' },
    ],
    edges: [
      { from: 'stage-data', to: 'student' },
      { from: 'teacher', to: 'triage' },
      { from: 'triage', to: 'correction', label: 'suspected old entity' },
      { from: 'prototype-memory', to: 'correction', label: 'no raw text stored' },
      { from: 'correction', to: 'student' },
      { from: 'head-anchor', to: 'student' },
    ],
    pipeline: ['stage data', 'teacher', 'triage', 'correction', 'student'],
  },
  'northstar-rag': {
    summary:
      'Document sources are ingested and chunked, embedded locally, filtered through persistent retrieval, and either grounded with citations or refused when nothing clears the distance threshold.',
    nodes: [
      { id: 'document-sources', label: 'Document sources', detail: 'PDF, text, Markdown' },
      { id: 'ingest-chunk', label: 'Ingest and chunk', detail: '700-character chunks, 100-character overlap' },
      { id: 'local-embeddings', label: 'Local embeddings', detail: 'all-MiniLM-L6-v2' },
      { id: 'chroma-retrieval', label: 'Chroma retrieval', detail: 'Distance-filtered evidence' },
      { id: 'grounded-answer', label: 'Grounded answer', detail: 'Source-numbered, cited generation' },
      { id: 'fixed-refusal', label: 'Fixed refusal', detail: 'No model call when nothing clears the bar' },
    ],
    edges: [
      { from: 'document-sources', to: 'ingest-chunk' },
      { from: 'ingest-chunk', to: 'local-embeddings' },
      { from: 'local-embeddings', to: 'chroma-retrieval' },
      { from: 'chroma-retrieval', to: 'grounded-answer', label: 'distance below threshold?' },
      { from: 'chroma-retrieval', to: 'fixed-refusal', label: 'distance below threshold?' },
    ],
    pipeline: ['sources', 'chunk', 'embed', 'retrieve', 'answer / refuse'],
  },
  'minds-eye': {
    summary:
      'A camera on the glasses reaches the Android app over Bluetooth, which routes captures to a Python recognition service and cloud vision services, then speaks the result back.',
    nodes: [
      { id: 'wearable-input', label: 'Wearable input', detail: 'ESP32-CAM on glasses' },
      { id: 'android-client', label: 'Android client', detail: 'Java app · two modes · TalkBack' },
      { id: 'python-service', label: 'Python service', detail: 'Flask on Heroku: OpenCV, face recognition, currency recognition' },
      { id: 'cloud-vision', label: 'Cloud vision', detail: 'Google Cloud Vision · Azure Computer Vision: captioning, labels/landmarks, objects, face attributes, OCR' },
      { id: 'speech-output', label: 'Speech output', detail: 'Text-to-speech' },
      { id: 'firebase', label: 'Firebase', detail: 'Users and familiar faces' },
    ],
    edges: [
      { from: 'wearable-input', to: 'android-client', label: 'Bluetooth' },
      { from: 'android-client', to: 'python-service' },
      { from: 'android-client', to: 'cloud-vision' },
      { from: 'python-service', to: 'speech-output' },
      { from: 'cloud-vision', to: 'speech-output' },
      { from: 'android-client', to: 'firebase' },
    ],
    pipeline: ['glasses', 'Android app', 'recognition services', 'speech'],
  },
  dive: {
    summary:
      'The Android client posts a dive plan to a hosted model API, and an unsafe result feeds a recommendation loop that narrows the plan until the model accepts it.',
    nodes: [
      { id: 'android-client', label: 'Android client', detail: 'Java / XML' },
      { id: 'model-api', label: 'Model API', detail: 'Python on PythonAnywhere: SVC · LR · Decision Tree · ANN' },
      { id: 'result', label: 'Result', detail: 'Safe / not safe' },
      { id: 'recommend-loop', label: 'Recommend loop', detail: 'Reduce depth + bottom time, ask again' },
      { id: 'erdpml', label: 'eRDPML', detail: 'RDP tables: pressure group' },
      { id: 'firebase-services', label: 'Firebase services', detail: 'Auth · Realtime DB' },
      { id: 'location-weather', label: 'Location & weather', detail: 'Google Maps · OpenWeather' },
    ],
    edges: [
      { from: 'android-client', to: 'model-api', label: 'HTTPS POST' },
      { from: 'model-api', to: 'result' },
      { from: 'result', to: 'recommend-loop' },
      { from: 'recommend-loop', to: 'model-api' },
      { from: 'android-client', to: 'erdpml' },
      { from: 'android-client', to: 'firebase-services' },
      { from: 'android-client', to: 'location-weather' },
    ],
    pipeline: ['plan', 'model check', 'result', 'recommend'],
  },
  dostava: {
    summary:
      'The Android interface presents categories and orders through an MVVM presentation layer that authenticates with Firebase and reads and writes a single Realtime Database.',
    nodes: [
      { id: 'android-interface', label: 'Android interface', detail: 'Java' },
      { id: 'mvvm-presentation', label: 'MVVM presentation', detail: 'ViewModel/LiveData' },
      { id: 'firebase-auth', label: 'Firebase Auth', detail: 'Facebook + Google' },
      { id: 'realtime-database', label: 'Realtime Database', detail: 'Users, orders, catalogue' },
      { id: 'order-status', label: 'Order status', detail: '"being prepared" → "delivered"' },
      { id: 'firebase-storage', label: 'Firebase Storage', detail: 'Media assets' },
    ],
    edges: [
      { from: 'android-interface', to: 'mvvm-presentation' },
      { from: 'mvvm-presentation', to: 'firebase-auth' },
      { from: 'mvvm-presentation', to: 'realtime-database' },
      { from: 'realtime-database', to: 'order-status' },
      { from: 'mvvm-presentation', to: 'firebase-storage' },
    ],
    pipeline: ['app', 'MVVM', 'Firebase Auth', 'Realtime DB', 'order status'],
  },
  'applied-ml-portfolio': {
    summary:
      'Every engagement moved through the same delivery lifecycle from scoping to a documented handover.',
    nodes: [
      { id: 'scope', label: 'Scope', detail: 'Business question' },
      { id: 'data', label: 'Data', detail: 'Collection and preparation' },
      { id: 'features-cv', label: 'Features / CV', detail: 'Feature engineering or vision preprocessing' },
      { id: 'model-selection', label: 'Model selection', detail: 'Comparing candidate models' },
      { id: 'evaluation', label: 'Evaluation', detail: 'Held-out validation' },
      { id: 'delivery', label: 'Delivery', detail: 'Notebook · API · Docker' },
      { id: 'handover', label: 'Handover', detail: 'Documentation and walkthrough' },
    ],
    edges: [
      { from: 'scope', to: 'data' },
      { from: 'data', to: 'features-cv' },
      { from: 'features-cv', to: 'model-selection' },
      { from: 'model-selection', to: 'evaluation' },
      { from: 'evaluation', to: 'delivery' },
      { from: 'delivery', to: 'handover' },
    ],
    pipeline: ['scope', 'data', 'features', 'model', 'evaluate', 'deliver', 'handover'],
  },
  'cti-intrusion-detection': {
    summary:
      'Raw flow captures are consolidated, cleaned, pruned by correlation, and compared across four model families before the near-perfect scores are put through diagnostics.',
    nodes: [
      { id: 'flow-csvs', label: 'Flow CSVs', detail: 'Benign vs DoS/DDoS captures' },
      { id: 'consolidated-dataset', label: 'Consolidated dataset', detail: 'Merged flow records' },
      { id: 'cleanup', label: 'Cleanup', detail: 'Drop identifiers, zero-variance columns' },
      { id: 'correlation-prune', label: 'Correlation pruning', detail: '|r| > 0.95 → ~63 features' },
      { id: 'split-scale', label: 'Split & scale', detail: 'Stratified 80/20' },
      { id: 'models', label: 'Models', detail: 'LR · RF · GB · Keras ANN' },
      { id: 'diagnostics', label: 'Diagnostics', detail: 'Confusion matrices · ROC' },
    ],
    edges: [
      { from: 'flow-csvs', to: 'consolidated-dataset' },
      { from: 'consolidated-dataset', to: 'cleanup' },
      { from: 'cleanup', to: 'correlation-prune' },
      { from: 'correlation-prune', to: 'split-scale' },
      { from: 'split-scale', to: 'models' },
      { from: 'models', to: 'diagnostics' },
    ],
    pipeline: ['flows', 'consolidate', 'clean', 'prune', 'split', 'models', 'diagnostics'],
  },
  'search-for-eats': {
    summary:
      'The Android UI drives both a maps/list discovery flow and a Firebase-backed account profile.',
    nodes: [
      { id: 'android-ui', label: 'Android UI', detail: 'Java' },
      { id: 'location-maps', label: 'Location & maps', detail: 'Google Maps Platform' },
      { id: 'filter-sort', label: 'Filter & sort', detail: 'Category and rating' },
      { id: 'map-list-views', label: 'Map / list views', detail: 'Two presentations of results' },
      { id: 'firebase', label: 'Firebase', detail: 'Accounts' },
      { id: 'user-profile', label: 'User profile', detail: 'Saved state' },
    ],
    edges: [
      { from: 'android-ui', to: 'location-maps' },
      { from: 'location-maps', to: 'filter-sort' },
      { from: 'filter-sort', to: 'map-list-views' },
      { from: 'android-ui', to: 'firebase' },
      { from: 'firebase', to: 'user-profile' },
    ],
    pipeline: ['app', 'maps', 'filter', 'results'],
  },
  mercato: {
    summary:
      'Players record and edit a clip, upload it for feed playback, and manage accounts, billing, and notifications alongside it.',
    nodes: [
      { id: 'capture', label: 'Capture', detail: 'CameraKit' },
      { id: 'edit', label: 'Edit', detail: 'Trim + GPU filters' },
      { id: 'upload', label: 'Upload', detail: 'Firebase Storage' },
      { id: 'feed', label: 'Feed', detail: 'Realtime DB' },
      { id: 'playback', label: 'Playback', detail: 'ExoPlayer + cache' },
      { id: 'accounts', label: 'Accounts', detail: 'Facebook / Google sign-in' },
      { id: 'billing', label: 'Billing', detail: 'Subscription plans' },
      { id: 'push', label: 'Push', detail: 'FCM' },
    ],
    edges: [
      { from: 'capture', to: 'edit' },
      { from: 'edit', to: 'upload' },
      { from: 'upload', to: 'feed' },
      { from: 'feed', to: 'playback' },
      { from: 'accounts', to: 'feed' },
      { from: 'billing', to: 'feed' },
      { from: 'push', to: 'feed' },
    ],
    pipeline: ['capture', 'edit', 'upload', 'feed', 'playback'],
  },
  'food-planner': {
    summary:
      'Views talk to a presenter that separates remote recipe content from the user-owned data stored locally and reminders scheduled around it.',
    nodes: [
      { id: 'views', label: 'Views', detail: 'Screens' },
      { id: 'presenter', label: 'Presenter', detail: 'MVP' },
      { id: 'repository', label: 'Repository', detail: 'Single data boundary' },
      { id: 'mealdb-api', label: 'TheMealDB API', detail: 'Via Retrofit' },
      { id: 'room', label: 'Room', detail: 'Favourites and weekly plan' },
      { id: 'firebase-auth', label: 'Firebase Auth', detail: 'Optional; guest mode skips it' },
      { id: 'reminders', label: 'Reminders', detail: 'WorkManager' },
    ],
    edges: [
      { from: 'views', to: 'presenter' },
      { from: 'presenter', to: 'repository' },
      { from: 'repository', to: 'mealdb-api' },
      { from: 'repository', to: 'room' },
      { from: 'presenter', to: 'firebase-auth' },
      { from: 'presenter', to: 'reminders' },
    ],
    pipeline: ['views', 'presenter', 'repository', 'remote / local'],
  },
  'weather-checker': {
    summary:
      'A ViewModel and repository separate forecast networking from cached and preferred state, with alarms and map picking alongside.',
    nodes: [
      { id: 'views', label: 'Views', detail: 'Screens' },
      { id: 'viewmodel', label: 'ViewModel', detail: 'Presentation state' },
      { id: 'repository', label: 'Repository', detail: 'Single data boundary' },
      { id: 'forecast-api', label: 'Forecast API', detail: 'Retrofit + Coroutines' },
      { id: 'room', label: 'Room', detail: 'Favourites and cache' },
      { id: 'preferences', label: 'Preferences', detail: 'Units and language' },
      { id: 'alarms', label: 'Alarms', detail: 'Broadcast receivers' },
      { id: 'notifications', label: 'Notifications', detail: 'Weather alerts' },
      { id: 'maps', label: 'Maps', detail: 'Place picking' },
    ],
    edges: [
      { from: 'views', to: 'viewmodel' },
      { from: 'viewmodel', to: 'repository' },
      { from: 'repository', to: 'forecast-api' },
      { from: 'repository', to: 'room' },
      { from: 'repository', to: 'preferences' },
      { from: 'alarms', to: 'notifications' },
      { from: 'viewmodel', to: 'maps' },
    ],
    pipeline: ['views', 'viewmodel', 'repository', 'forecast'],
  },
  'shop-on-the-go': {
    summary:
      'StateFlow-driven view models sit above a repository that fans out to remote, local, and preference stores, feeding a cart-to-checkout flow.',
    nodes: [
      { id: 'views', label: 'Views', detail: 'Screens' },
      { id: 'viewmodels', label: 'ViewModels', detail: 'StateFlow' },
      { id: 'repository', label: 'Repository', detail: 'Single data boundary' },
      { id: 'remote', label: 'Remote', detail: 'Retrofit' },
      { id: 'room', label: 'Room', detail: 'Cache' },
      { id: 'datastore', label: 'DataStore', detail: 'Preferences' },
      { id: 'firebase-auth', label: 'Firebase Auth', detail: 'Sign-in' },
      { id: 'cart', label: 'Cart', detail: 'Line items' },
      { id: 'draft-order', label: 'Draft order', detail: 'Pending checkout' },
      { id: 'checkout', label: 'Checkout', detail: 'Coupons · multi-currency' },
    ],
    edges: [
      { from: 'views', to: 'viewmodels' },
      { from: 'viewmodels', to: 'repository' },
      { from: 'repository', to: 'remote' },
      { from: 'repository', to: 'room' },
      { from: 'repository', to: 'datastore' },
      { from: 'viewmodels', to: 'firebase-auth' },
      { from: 'cart', to: 'draft-order' },
      { from: 'draft-order', to: 'checkout' },
    ],
    pipeline: ['views', 'viewmodels', 'repository', 'cart', 'checkout'],
  },
  'documentum-workflows': {
    summary:
      'Documents move from intake through classification and a review workflow into lifecycle states, checked throughout by DQL health queries.',
    nodes: [
      { id: 'intake', label: 'Intake', detail: 'Document arrival' },
      { id: 'classification', label: 'Classification', detail: 'Type and metadata' },
      { id: 'review-workflow', label: 'Review workflow', detail: 'Routed approvals' },
      { id: 'lifecycle-states', label: 'Lifecycle states', detail: 'Status transitions' },
      { id: 'archive-retention', label: 'Archive & retention', detail: 'Regulated retention' },
      { id: 'dql-checks', label: 'DQL checks', detail: 'Health queries' },
      { id: 'operations', label: 'Operations', detail: 'Production support' },
    ],
    edges: [
      { from: 'intake', to: 'classification' },
      { from: 'classification', to: 'review-workflow' },
      { from: 'review-workflow', to: 'lifecycle-states' },
      { from: 'lifecycle-states', to: 'archive-retention' },
      { from: 'dql-checks', to: 'operations' },
    ],
    pipeline: ['intake', 'classify', 'review', 'lifecycle', 'archive'],
  },
  'pdf-utilities': {
    summary:
      'Inputs pass through iText modules to a Tomcat-hosted service that produces a packaged document, with logging throughout.',
    nodes: [
      { id: 'inputs', label: 'Inputs', detail: 'Scans and letters' },
      { id: 'itext-modules', label: 'iText modules', detail: 'Generation, assembly, transformation' },
      { id: 'tomcat-service', label: 'Tomcat service', detail: 'Hosted processing' },
      { id: 'document-package', label: 'Document package', detail: 'Ordered, traceable output' },
      { id: 'logging', label: 'Logging', detail: 'log4j diagnostics' },
    ],
    edges: [
      { from: 'inputs', to: 'itext-modules' },
      { from: 'itext-modules', to: 'tomcat-service' },
      { from: 'tomcat-service', to: 'document-package' },
      { from: 'itext-modules', to: 'logging' },
    ],
    pipeline: ['inputs', 'iText', 'service', 'package'],
  },
  'rest-pocs': {
    summary:
      'A service layer bridges SOAP-based enterprise systems and a documented REST/JSON contract for client demos.',
    nodes: [
      { id: 'enterprise-systems', label: 'Enterprise systems', detail: 'SOAP' },
      { id: 'service-layer', label: 'Service layer', detail: 'Spring Boot / Python' },
      { id: 'rest-endpoint', label: 'REST endpoint', detail: 'JSON schema + basic auth' },
      { id: 'client-demo', label: 'Client demo', detail: 'Prototype consumer' },
    ],
    edges: [
      { from: 'enterprise-systems', to: 'service-layer' },
      { from: 'service-layer', to: 'rest-endpoint' },
      { from: 'rest-endpoint', to: 'client-demo' },
    ],
    pipeline: ['SOAP', 'service', 'REST', 'demo'],
  },
  'this-portfolio': {
    summary:
      'Curated, typed content pre-renders the site, while a separate assistant path retrieves over the same curated evidence, refuses before generation, and validates citations before answering.',
    nodes: [
      { id: 'curated-data', label: 'Curated data', detail: 'Typed, Zod-validated facts' },
      { id: 'astro-pages', label: 'Astro pages', detail: 'Pre-rendered + role switcher' },
      { id: 'question', label: 'Question', detail: 'Visitor query' },
      { id: 'turnstile-ratelimit', label: 'Turnstile + rate limits', detail: 'Abuse protection' },
      { id: 'retrieval', label: 'Retrieval', detail: 'Lexical retrieval over curated evidence' },
      { id: 'refusal-gate', label: 'Refusal gate', detail: 'Blocks unsupported questions before generation' },
      { id: 'workers-ai', label: 'Workers AI', detail: 'Llama 3.1 8B' },
      { id: 'citation-check', label: 'Citation check', detail: 'Validates cited sources' },
      { id: 'answer', label: 'Answer', detail: 'Cited response' },
      { id: 'extractive-fallback', label: 'Extractive fallback', detail: 'Deterministic verified text' },
    ],
    edges: [
      { from: 'curated-data', to: 'astro-pages' },
      { from: 'question', to: 'turnstile-ratelimit' },
      { from: 'turnstile-ratelimit', to: 'retrieval' },
      { from: 'retrieval', to: 'refusal-gate' },
      { from: 'refusal-gate', to: 'workers-ai' },
      { from: 'workers-ai', to: 'citation-check' },
      { from: 'citation-check', to: 'answer' },
      { from: 'citation-check', to: 'extractive-fallback' },
    ],
    pipeline: ['question', 'gate', 'retrieve', 'refuse?', 'generate', 'verify', 'answer'],
  },
  'cloud-backend': {
    summary:
      'Requests pass through a validated Express route to a controller, service, and Mongoose model over MongoDB, with bcrypt and short-lived JWTs guarding access.',
    nodes: [
      { id: 'client', label: 'Client', detail: 'HTTP request files' },
      { id: 'express-route', label: 'Express route', detail: 'Validation' },
      { id: 'controller', label: 'Controller', detail: 'Request handling' },
      { id: 'service', label: 'Service', detail: 'Business rules' },
      { id: 'mongoose-model', label: 'Mongoose model', detail: 'Schema' },
      { id: 'mongodb', label: 'MongoDB', detail: 'Persistence' },
      { id: 'auth', label: 'Auth', detail: 'bcrypt + 1-hour JWT' },
    ],
    edges: [
      { from: 'client', to: 'express-route' },
      { from: 'express-route', to: 'controller' },
      { from: 'controller', to: 'service' },
      { from: 'service', to: 'mongoose-model' },
      { from: 'mongoose-model', to: 'mongodb' },
      { from: 'auth', to: 'controller' },
    ],
    pipeline: ['client', 'route', 'controller', 'service', 'model', 'db'],
  },
} as const;

export type ArchitectureSlug = keyof typeof architectures;
