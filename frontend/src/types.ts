// Strip any trailing slash so `${API}/parse` never becomes "//parse" (a 404)
export const API = (import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");

export type Deadline = {
  id?: number;
  course: string;
  title: string;
  date: string;
  category: string;
  source: string;
};

export type ParseResponse = {
  deadlines: Deadline[];
};