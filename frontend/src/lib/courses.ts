import type { Deadline } from "../types";

// Course colors: a colorblind-checked palette, handed out in a fixed order.
// Courses past the 8th share a neutral gray instead of reusing a color.
export const COURSE_COLORS = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"];
export const OTHER_COLOR = "#8a87a8";

export function listCourses(deadlines: Deadline[]) {
  return [...new Set(deadlines.map((d) => d.course))];
}

export function courseColor(courses: string[], course: string) {
  const i = courses.indexOf(course);
  return i >= 0 && i < COURSE_COLORS.length ? COURSE_COLORS[i] : OTHER_COLOR;
}
