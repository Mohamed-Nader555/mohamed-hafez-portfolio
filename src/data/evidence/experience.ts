import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const bassRecords = [
  {
    id: 'bass-java-services',
    title: 'BASS Java services',
    statement:
      'At BASS, I developed Java and Spring Boot services for enterprise content-management workflows.',
    topics: ['BASS', 'Java', 'Spring Boot', 'enterprise systems'],
    aliases: ['enterprise content management', 'ECM'],
    roleWeights: { aiml: 2, software: 5, android: 1, teaching: 3 },
    sourceIds: ['resume-aiml', 'resume-software', 'public-experience'],
    public: true,
  },
  {
    id: 'bass-api-delivery',
    title: 'BASS API delivery',
    statement: 'At BASS, I worked with REST and SOAP APIs.',
    topics: ['BASS', 'REST APIs', 'SOAP APIs'],
    aliases: ['enterprise APIs', 'service integration'],
    roleWeights: { aiml: 1, software: 5, android: 2, teaching: 2 },
    sourceIds: ['resume-software', 'resume-teaching', 'public-experience'],
    public: true,
  },
  {
    id: 'bass-document-workflows',
    title: 'Enterprise document workflows',
    statement:
      'I supported OpenText Documentum workflows and validation controls in regulated, PII-aware environments at BASS.',
    topics: ['BASS', 'OpenText Documentum', 'validation', 'PII'],
    aliases: ['document management', 'regulated workflows'],
    roleWeights: { aiml: 2, software: 5, android: 1, teaching: 3 },
    sourceIds: [
      'resume-aiml',
      'resume-software',
      'resume-teaching',
      'public-experience',
    ],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

const currentRoleRecords = [
  {
    id: 'eklan-current-role',
    title: 'Current role at Eklan',
    statement:
      'I am currently working as Founding AI Engineer at Eklan in Toronto (Sep 2026 to present), where I build the AI features of an English-communication training platform for healthcare professionals.',
    topics: ['Eklan', 'Founding AI Engineer', 'current role', 'notice period'],
    aliases: [
      'current employer',
      'present role',
      'where does Mohamed work now',
      'who does Mohamed work for',
    ],
    roleWeights: { aiml: 4, software: 4, android: 0, teaching: 0 },
    sourceIds: ['public-experience'],
    public: true,
  },
  {
    id: 'eklan-voice-roleplay',
    title: 'Real-time voice roleplay at Eklan',
    statement:
      'At Eklan, I architected and shipped real-time voice roleplay where learners practise hospital conversations out loud with AI patients, relatives and clinicians. Browser audio streams straight to the Gemini Live API through short-lived, config-locked tokens; median time to first AI audio is about 1.4 s, measured in testing against the live models.',
    topics: [
      'Eklan',
      'voice AI',
      'real-time voice',
      'Gemini Live',
      'WebSockets',
      'AudioWorklet',
    ],
    aliases: ['voice roleplay', 'speech-to-speech', 'conversational AI'],
    roleWeights: { aiml: 5, software: 4, android: 1, teaching: 2 },
    sourceIds: ['public-experience', 'case-study-eklan-voice-roleplay'],
    public: true,
  },
  {
    id: 'eklan-multi-character',
    title: 'Multi-character voice mode at Eklan',
    statement:
      'At Eklan, I built a multi-character voice mode, live in production, where each extra character runs as its own Gemini Live session and voice and a fast Gemini Flash director model routes every learner turn to the right character.',
    topics: ['Eklan', 'multi-agent orchestration', 'voice AI', 'Gemini Live'],
    aliases: ['multi-agent', 'director model', 'agent routing'],
    roleWeights: { aiml: 5, software: 4, android: 1, teaching: 1 },
    sourceIds: ['public-experience'],
    public: true,
  },
  {
    id: 'eklan-grading-pipeline',
    title: 'Speech grading pipeline at Eklan',
    statement:
      'At Eklan, I designed a 5-stage speech grading pipeline: verbatim transcription, SpeechAce pronunciation scoring, LLM language and communication scoring, fluency computed in code, and LLM coaching, with retries, locks and model fallback on rate limits.',
    topics: ['Eklan', 'LLM evaluation', 'speech grading', 'SpeechAce'],
    aliases: ['speech assessment', 'pronunciation scoring', 'LLM-as-judge'],
    roleWeights: { aiml: 5, software: 4, android: 0, teaching: 3 },
    sourceIds: ['public-experience', 'case-study-eklan-grading-pipeline'],
    public: true,
  },
  {
    id: 'eklan-ai-coach',
    title: 'On-demand AI coach at Eklan',
    statement:
      'At Eklan, I took an on-demand AI coach for unplanned workplace English from PRD to staging in 3 days, with Gemini structured outputs, a rule-based output checker, English and Korean PII redaction and a 48-case eval suite.',
    topics: ['Eklan', 'AI coach', 'structured outputs', 'PII redaction'],
    aliases: ['LLM guardrails', 'eval suite', 'job queue'],
    roleWeights: { aiml: 5, software: 5, android: 0, teaching: 2 },
    sourceIds: ['public-experience'],
    public: true,
  },
  {
    id: 'eklan-transcript-mining',
    title: 'Transcript mining at Eklan',
    statement:
      'At Eklan, I built an LLM pipeline that pulls each learner’s own mistakes out of live-class transcripts, filters sensitive personal topics and lets tutors edit the results into targeted drills.',
    topics: ['Eklan', 'information extraction', 'LLM tool calling', 'tutors'],
    aliases: ['transcript analysis', 'mistake extraction'],
    roleWeights: { aiml: 5, software: 3, android: 0, teaching: 4 },
    sourceIds: ['public-experience'],
    public: true,
  },
  {
    id: 'eklan-composed-prompts',
    title: 'Composed drill prompts at Eklan',
    statement:
      'At Eklan, I replaced one shared drill-generation prompt with composed per-drill-type prompts behind feature flags, doubling items per drill and cutting answer-position bias.',
    topics: ['Eklan', 'prompt engineering', 'personalization', 'drills'],
    aliases: ['prompt composition', 'feature flags'],
    roleWeights: { aiml: 5, software: 3, android: 0, teaching: 3 },
    sourceIds: ['public-experience'],
    public: true,
  },
  {
    id: 'eklan-full-stack-delivery',
    title: 'Full-stack delivery at Eklan',
    statement:
      'At Eklan, I own features end to end on a small founding team: TypeScript and Next.js APIs, React UI, MongoDB models and indexes, PostHog analytics and feature-flagged releases from staging to production on Vercel.',
    topics: ['Eklan', 'TypeScript', 'Next.js', 'MongoDB', 'Vercel', 'React'],
    aliases: ['full-stack', 'founding engineer', 'end-to-end ownership'],
    roleWeights: { aiml: 3, software: 5, android: 1, teaching: 1 },
    sourceIds: ['public-experience'],
    public: true,
  },
  {
    id: 'eklan-agentic-workflow',
    title: 'Spec-driven agentic development at Eklan',
    statement:
      'At Eklan, I run development as a spec-driven agent workflow in Claude Code: I write implementation briefs with numbered tasks, acceptance checks and review gates, direct the agents one commit per task, review and test the result, and keep a human approval step for anything that touches production.',
    topics: ['Eklan', 'Claude Code', 'AI-assisted development', 'MCP'],
    aliases: ['agentic workflow', 'coding agents', 'spec-driven development'],
    roleWeights: { aiml: 4, software: 4, android: 1, teaching: 2 },
    sourceIds: ['public-experience'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

const mercatoRecords = [
  {
    id: 'mercato-football-talent',
    title: 'Mercato platform purpose',
    statement:
      'Mercato Star Finder is a football-talent platform where players present their skills for club agents to scout and sign them.',
    topics: ['Mercato', 'Android', 'football talent'],
    aliases: ['Mercato Star Finder', 'football-talent platform'],
    roleWeights: { aiml: 0, software: 2, android: 4, teaching: 1 },
    sourceIds: ['resume-android', 'case-study-mercato'],
    public: true,
  },
  {
    id: 'android-historical-play-store',
    title: 'Historical Android app availability',
    statement:
      'Four apps were previously published on Google Play: three under client-owned listings (Dostava, Your Life Is My Life, and The Death Ninja) and one, Healthy Habit / Food Planner, as part of my ITI training. Search for Eats was not published to Google Play.',
    topics: ['Android', 'Google Play', 'historical availability'],
    aliases: ['Play Store', 'Google Play apps', '16 Android applications'],
    roleWeights: { aiml: 1, software: 3, android: 5, teaching: 1 },
    sourceIds: ['resume-android', 'resume-software'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const bassEvidence = evidenceRecordSchema.array().parse(bassRecords);
export const currentRoleEvidence = evidenceRecordSchema
  .array()
  .parse(currentRoleRecords);
export const mercatoEvidence = evidenceRecordSchema
  .array()
  .parse(mercatoRecords);
export const experienceEvidence = evidenceRecordSchema
  .array()
  .parse([...currentRoleEvidence, ...bassEvidence, ...mercatoEvidence]);
