export interface User {
  id: number;
  name: string;
  avatar: string;
  role: string;
  daily_goal: number;
  today_completed: number;
  avg_score?: number;
  total_points?: number;
  created_at?: string;
}

export type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.25 | 1.5 | 2.0;

export interface StudySet {
  id: number;
  title: string;
  description?: string;
  category: 'system' | 'custom';
  icon: string;
  difficulty?: string;
  passage_text?: string;
  total_sentences?: number;
  practiced_sentences?: number;
  completion_rate?: number;
  avg_score?: number;
  best_score?: number | null;
  preview_sentences?: string[];
  created_at?: string;
  sentence_count?: number;
  completed_count?: number;
  progress_percent?: number;
}

export interface ExtractedSentence {
  id?: number;
  text: string;
  translation?: string;
  word_count?: number;
  difficulty?: string;
  audio_hint?: string;
}

export interface TopicGroup {
  id?: number;
  topic_title: string;
  title?: string;
  passage_text: string;
  difficulty?: string;
  icon?: string;
  total_sentences?: number;
  sentences: ExtractedSentence[];
}

export interface Sentence {
  id: number;
  set_id?: number;
  text: string;
  translation: string;
  topic: string;
  topic_vi: string;
  difficulty: string;
  audio_hint?: string;
  best_score?: number | null;
  last_score?: number;
  attempts_count?: number;
  order_index?: number;
}

export interface WordResult {
  target_word: string;
  clean_target?: string;
  spoken_word?: string | null;
  recognized_word?: string | null;
  status: 'correct' | 'warning' | 'error' | 'missing';
  score: number;
  feedback: string;
}

export interface AttemptHistoryItem {
  attempt_number: number;
  overall_score: number;
  created_at: string;
}

export interface AttemptResult {
  attempt_id?: number;
  attempt_number?: number;
  overall_score: number;
  accuracy_score: number;
  completeness_score: number;
  fluency_score: number;
  transcript?: string;
  spoken_text?: string;
  word_results: WordResult[];
  feedback_summary: string;
  attempts_history?: AttemptHistoryItem[];
}

export interface RecentAttempt {
  id: number;
  sentence_text: string;
  sentence_translation: string;
  overall_score: number;
  created_at: string;
}

export interface MissedWord {
  word: string;
  count: number;
}

export interface UserProgress {
  user_id: number;
  user_name: string;
  avatar: string;
  daily_goal?: number;
  today_completed?: number;
  total_attempts: number;
  sentences_practiced: number;
  avg_score: number;
  best_score: number;
  recent_attempts: RecentAttempt[];
  top_missed_words: MissedWord[];
  sets_progress?: StudySet[];
}
