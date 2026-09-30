export const API = "http://127.0.0.1:8000";

export type Deadline = {
  course: string;
  title: string;
  date: string;
  category: string;
  source: string;
};

export type ParseResponse = {
  deadlines: Deadline[];
};