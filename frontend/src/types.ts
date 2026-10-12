// Strip any trailing slash so `${API}/parse` never becomes "//parse" (a 404)
export const API = (import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");

export type Deadline = {
  id?: number;
  course: string;
  title: string;
  date: string;
  category: string;
  source: string;
  done?: boolean;
};

export type SharedSyllabus = {
  id: number;
  course: string;
  deadlines: Deadline[];
  instructor: string | null;
  uploaded_by: string;
  use_count: number;
  updated_at: string;
};

export type ParseResponse = {
  deadlines: Deadline[];
  instructor?: string;
};
export type StudyMatch = {
  id: number;
  course: string;
  user_a: string;
  user_b: string;
  user_a_name: string;
  user_b_name: string;
  user_a_avatar: string | null;
  user_b_avatar: string | null;
  ended_at: string | null;
  created_at: string;
};

export type StudyMessage = {
  id: number;
  match_id: number;
  sender: string;
  body: string;
  created_at: string;
};
