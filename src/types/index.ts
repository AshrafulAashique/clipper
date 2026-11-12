export interface WordSegment {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface TranscriptSegment {
  text: string;
  start: number;    // in seconds
  duration: number; // in seconds
  words?: WordSegment[];
}

export type MomentCategory = 'joke' | 'unexpected' | 'reaction' | 'punchline' | 'insight';

export interface ClipMoment {
  id: string;
  title: string;
  hook: string;
  reason: string;
  viralityScore: number; // 0 - 100
  category: MomentCategory;
  startTime: number;     // in seconds
  endTime: number;       // in seconds
  duration: number;      // in seconds (15 - 30s)
  segments: TranscriptSegment[];
  tags: string[];
  aspectRatio?: '9:16' | '1:1' | '16:9';
}

export interface VideoMetadata {
  id: string;
  title: string;
  author: string;
  duration: number;
  thumbnailUrl: string;
  url: string;
  directStreamUrl?: string;
}

export interface DetectionReport {
  video: VideoMetadata;
  clips: ClipMoment[];
  totalMomentsFound: number;
  hasMinimumFive: boolean;
  statusMessage: string;
  transcriptionSource: 'youtube-captions' | 'ai-whisper' | 'ai-gemini' | 'simulated';
}

export type SubtitleStyle = 'hormozi' | 'neon' | 'crisp';

