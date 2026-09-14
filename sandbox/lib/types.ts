export type Platform = "youtube" | "tiktok" | "ig" | "x";
export type Format = "vlog" | "talking head" | "carousel" | "short";
export type Status = "idea" | "scripted" | "filmed" | "posted" | "killed";

export const PLATFORMS: Platform[] = ["youtube", "tiktok", "ig", "x"];
export const FORMATS: Format[] = ["vlog", "talking head", "carousel", "short"];
export const STATUSES: Status[] = ["idea", "scripted", "filmed", "posted", "killed"];

export type Beat = {
  name: string;
  timestamp: string;
  what_happens: string;
  why_it_works: string;
};

export type Inspo = {
  id: number;
  url: string;
  title: string;
  creator: string;
  platform: Platform;
  added_at: string;
  transcript: string;
  notes: string;
  beats: Beat[];
  tags: string;
  rating: number | null;
};

export type Idea = {
  id: number;
  title: string;
  hook: string;
  one_line: string;
  format: Format;
  status: Status;
  inspo_id: number | null;
  script: string;
  beats: Beat[];
  created_at: string;
  updated_at: string;
};

export type Video = {
  id: number;
  idea_id: number | null;
  title: string;
  url: string;
  platform: Platform;
  posted_at: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  follows_gained: number | null;
  link_clicks: number | null;
  founding_spots: number | null;
  notes: string;
  logged_at: string;
};

export const VIDEO_METRICS = [
  "views",
  "likes",
  "comments",
  "shares",
  "saves",
  "follows_gained",
  "link_clicks",
  "founding_spots",
] as const;
export type VideoMetric = (typeof VIDEO_METRICS)[number];
