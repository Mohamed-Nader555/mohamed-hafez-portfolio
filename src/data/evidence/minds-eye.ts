import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const records = [
  {
    id: 'minds-eye-purpose',
    title: 'Assistive smart-glasses system',
    statement:
      'Mind’s Eye is an assistive smart-glasses system that combines mobile, embedded, and cloud components for a Visually Impaired mode and an Alzheimer mode.',
    topics: ['Mind’s Eye', 'assistive technology', 'smart glasses'],
    aliases: ['Minds Eye', 'wearable assistive system'],
    roleWeights: { aiml: 4, software: 2, android: 5, teaching: 3 },
    sourceIds: ['resume-aiml', 'resume-android', 'case-study-minds-eye'],
    public: true,
  },
  {
    id: 'minds-eye-team-and-delivery',
    title: 'Mind’s Eye ownership',
    statement:
      'Mind’s Eye was a five-person B.Sc. capstone graded A+. I delivered more than 80% of the system: the Android app, cloud integrations, ESP32-CAM firmware and Bluetooth link, the Python service, interface contracts, error handling, and deployment.',
    topics: ['Mind’s Eye', 'ownership', 'delivery', 'capstone'],
    aliases: [
      'project contribution',
      'implementation ownership',
      'five-person team',
    ],
    roleWeights: { aiml: 4, software: 3, android: 5, teaching: 2 },
    sourceIds: [
      'resume-aiml',
      'resume-android',
      'resume-software',
      'case-study-minds-eye',
    ],
    public: true,
  },
  {
    id: 'minds-eye-currency-recognition',
    title: 'Currency recognition',
    statement:
      'I built the Egyptian-currency recognition capability from scratch: my own denomination-recognition model, served from my Python service, with spoken confirmation. It has no public accuracy figure.',
    topics: ['Mind’s Eye', 'computer vision', 'currency recognition'],
    aliases: ['Egyptian currency', 'banknote recognition'],
    roleWeights: { aiml: 5, software: 2, android: 5, teaching: 3 },
    sourceIds: ['resume-aiml', 'resume-android', 'case-study-minds-eye'],
    public: true,
  },
  {
    id: 'minds-eye-hardware',
    title: 'Wearable hardware',
    statement:
      'Mind’s Eye’s wearable is an ESP32-CAM module (ESP32-S chip, OV2640 camera, microSD) mounted on glasses, programmed with the Arduino framework, sending images to the phone over Bluetooth. The user captures a photo with the camera’s button or picks one from the gallery; the mode is chosen in the Android app.',
    topics: ['Mind’s Eye', 'ESP32-CAM', 'Bluetooth', 'Arduino', 'hardware'],
    aliases: ['wearable integration', 'smart glasses hardware', 'ESP32'],
    roleWeights: { aiml: 3, software: 3, android: 5, teaching: 3 },
    sourceIds: ['resume-android', 'case-study-minds-eye'],
    public: true,
  },
  {
    id: 'minds-eye-cloud-services',
    title: 'Recognition service integration',
    statement:
      'The Android client sends captures to my Python service (Flask on Heroku, for OpenCV, face recognition, and currency recognition) and to Google Cloud Vision and Azure Computer Vision for captioning, labels and landmarks, object detection, face attributes, and OCR, then speaks the result with text-to-speech.',
    topics: [
      'Android',
      'REST APIs',
      'Google Cloud Vision',
      'Azure Computer Vision',
      'recognition',
    ],
    aliases: ['mobile API integration', 'recognition API', 'cloud vision'],
    roleWeights: { aiml: 3, software: 3, android: 5, teaching: 2 },
    sourceIds: ['resume-android', 'case-study-minds-eye'],
    public: true,
  },
  {
    id: 'minds-eye-ocr-speech',
    title: 'OCR-to-speech workflow',
    statement:
      'Mind’s Eye uses Tesseract OCR to extract text and returns results through text-to-speech, since the interaction has no visual screen to rely on.',
    topics: ['Mind’s Eye', 'Tesseract OCR', 'text-to-speech'],
    aliases: ['OCR', 'read text aloud'],
    roleWeights: { aiml: 4, software: 2, android: 5, teaching: 2 },
    sourceIds: ['resume-aiml', 'resume-android', 'case-study-minds-eye'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const mindsEyeEvidence = evidenceRecordSchema.array().parse(records);
