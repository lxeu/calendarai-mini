import type { Deadline } from "../types";
import { addDays, isValidISO } from "./dates";

// Calendar export: an .ics file (Apple, Google, Outlook all import it)
// and a one-click "add to Google Calendar" link for a single deadline.

const compact = (iso: string) => iso.replaceAll("-", "");

function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// iCalendar lines must be folded at 75 bytes; continuation lines start with a space
function fold(line: string) {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    const limit = out.length === 0 ? 75 : 74;
    if (enc.encode(cur + ch).length > limit) {
      out.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.join("\r\n ");
}

export function buildICS(deadlines: Deadline[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CalendarAI Mini//EN", "CALSCALE:GREGORIAN"];
  deadlines
    .filter((d) => isValidISO(d.date))
    .forEach((d, i) => {
      lines.push(
        "BEGIN:VEVENT",
        `UID:${d.id ?? `n${i}`}-${compact(d.date)}@calendarai-mini`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${compact(d.date)}`,
        `DTEND;VALUE=DATE:${compact(addDays(d.date, 1))}`,
        `SUMMARY:${escapeText(`${d.course}: ${d.title}`)}`,
        `DESCRIPTION:${escapeText(`${d.category}\n\nFrom your syllabus:\n"${d.source}"`)}`,
        `CATEGORIES:${escapeText(d.category)}`,
        "END:VEVENT",
      );
    });
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function downloadICS(deadlines: Deadline[], filename = "calendarai-deadlines.ics") {
  const blob = new Blob([buildICS(deadlines)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function googleCalendarUrl(d: Deadline) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${d.course}: ${d.title}`,
    details: `From your syllabus:\n"${d.source}"`,
  });
  if (isValidISO(d.date)) params.set("dates", `${compact(d.date)}/${compact(addDays(d.date, 1))}`);
  return `https://calendar.google.com/calendar/render?${params}`;
}
