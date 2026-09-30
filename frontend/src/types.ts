export const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

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