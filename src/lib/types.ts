export type CheckinTiming = "morning" | "checkout";
export type Rating = "A" | "B" | "C";
export type TimePeriodRatings = Record<string, Rating>;

export interface Checkin {
  id: string;
  user_id: string;
  checked_at: string;
  timing: CheckinTiming;
  time_period_ratings: TimePeriodRatings;
  activity_tags: string[];
  free_text: string | null;
  condition_score: number | null;
  mind_score: number | null;
  body_score: number | null;
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
  week_end: string | null;
  insight_text: string;
  avg_score: number | null;
  created_at: string;
}

export interface DailyScore {
  date: string;
  score: number | null;
  mind_score: number | null;
  body_score: number | null;
}

export interface DailyMeditation {
  date: string;
  count: number;
}
