export type CheckinTiming = 'morning' | 'evening';

export interface Checkin {
  id: string;
  user_id: string;
  checked_at: string;
  timing: CheckinTiming;
  mood_score: number;
  emotion_tags: string[];
  activity_tags: string[];
  free_text: string | null;
  condition_score: number | null;
  ai_comment: string | null;
  created_at: string;
}

export interface MeditationLog {
  id: string;
  user_id: string;
  logged_at: string;
  timing: CheckinTiming;
  checkin_id: string | null;
  created_at: string;
}

export interface WeeklyInsight {
  id: string;
  user_id: string;
  week_start: string;
  insight_text: string;
  avg_score: number | null;
  created_at: string;
}

export interface DailyScore {
  date: string;
  score: number | null;
  morning_score: number | null;
  evening_score: number | null;
}

export interface DailyMeditation {
  date: string;
  count: number;
}
