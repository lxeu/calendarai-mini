import { useEffect, useState, type CSSProperties } from "react";
import { IconCheck, IconFile } from "./Icons";
import { COURSE_COLORS } from "../lib/courses";
import { prefersReducedMotion } from "../lib/motion";
import { todayISO } from "../lib/dates";

// Sample syllabus lines, placed on days of the current month
const ITEMS = [
  { course: "CMPUT 174", title: "Assignment 2", day: 6, color: COURSE_COLORS[0] },
  { course: "MATH 125", title: "Quiz 3", day: 9, color: COURSE_COLORS[1] },
  { course: "BIOL 107", title: "Lab report", day: 14, color: COURSE_COLORS[2] },
  { course: "CMPUT 174", title: "Midterm", day: 20, color: COURSE_COLORS[0] },
  { course: "ECON 101", title: "Problem set 4", day: 24, color: COURSE_COLORS[3] },
];
const STEP_MS = 1100;
// One step per line, then hold on the finished calendar for a few beats before starting over
const LOOP = ITEMS.length + 4;

// Login page demo: lines of a syllabus are read one at a time and land on a calendar
export default function HeroDemo() {
  const reduce = prefersReducedMotion();
  const [step, setStep] = useState(reduce ? ITEMS.length : 0);

  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => setStep((s) => (s + 1) % LOOP), STEP_MS);
    return () => clearInterval(timer);
  }, [reduce]);

  const [y, m, today] = todayISO().split("-").map(Number);
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const first = new Date(y, m - 1, 1);
  const monthName = first.toLocaleDateString(undefined, { month: "long" });
  const monthShort = first.toLocaleDateString(undefined, { month: "short" });
  const placed = Math.min(step, ITEMS.length);

  return (
    <div className="demo" aria-hidden="true">
      <div className="demo-doc">
        <p className="demo-file">
          <IconFile size={14} /> syllabus.pdf
        </p>
        <p className="demo-heading">Schedule</p>
        <ul className="demo-lines">
          {ITEMS.map((it, i) => (
            <li key={it.title} className={i === step ? "is-reading" : i < placed ? "is-done" : ""}>
              <span className="demo-line-text">
                {it.course} · {it.title}
              </span>
              <span className="demo-line-date">
                {monthShort} {it.day}
              </span>
              <IconCheck size={12} className="demo-line-check" />
            </li>
          ))}
        </ul>
      </div>

      <div className="demo-cal">
        <p className="demo-cal-head">
          {monthName} <span>{y}</span>
        </p>
        <div className="demo-grid">
          {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
            <span key={`w${i}`} className="demo-wd">
              {w}
            </span>
          ))}
          {Array.from({ length: firstWeekday }, (_, i) => (
            <span key={`b${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const k = ITEMS.findIndex((it) => it.day === day);
            const on = k >= 0 && k < placed;
            return (
              <span key={day} className={`demo-day${day === today ? " is-today" : ""}${on && k === placed - 1 && !reduce ? " is-new" : ""}`}>
                {day}
                {on && <i style={{ "--c": ITEMS[k].color } as CSSProperties} />}
              </span>
            );
          })}
        </div>
      </div>

      <div className={`demo-toast glass${step >= ITEMS.length ? " is-on" : ""}`}>
        <IconCheck size={14} /> Added {ITEMS.length} deadlines
      </div>
    </div>
  );
}
