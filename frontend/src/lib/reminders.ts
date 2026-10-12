import type { Deadline } from "../types";
import { daysBetween, relativeLabel, todayISO } from "./dates";

// How far ahead the Reminders card looks
export const REMIND_DAYS = 3;

const KEY_ON = "calendarai:notify";
const KEY_SENT = "calendarai:notified";

// Not done, due today through REMIND_DAYS from now, soonest first
export function dueSoon(deadlines: Deadline[], today = todayISO()) {
  return deadlines
    .filter((d) => !d.done)
    .map((d) => ({ d, days: daysBetween(today, d.date) }))
    .filter(({ days }) => days >= 0 && days <= REMIND_DAYS)
    .sort((a, b) => a.days - b.days);
}

// Browser notifications only fire while CalendarAI is open in a tab.
// localStorage can throw (private mode, blocked storage), so every access is guarded.
export const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;

export function notificationsOn() {
  try {
    return notificationsSupported() && Notification.permission === "granted" && localStorage.getItem(KEY_ON) === "1";
  } catch {
    return false;
  }
}

export async function setNotifications(on: boolean) {
  if (on && notificationsSupported() && Notification.permission !== "granted") {
    if ((await Notification.requestPermission()) !== "granted") return false;
  }
  try {
    localStorage.setItem(KEY_ON, on ? "1" : "0");
  } catch {
    // remembered for this visit only
  }
  return on;
}

// One notification per deadline per day, for anything due today or tomorrow
export function sendDueNotifications(deadlines: Deadline[]) {
  if (!notificationsOn()) return;
  const today = todayISO();
  let sent: string[];
  try {
    sent = JSON.parse(localStorage.getItem(KEY_SENT) ?? "[]");
  } catch {
    sent = [];
  }
  for (const { d, days } of dueSoon(deadlines, today)) {
    if (days > 1) continue;
    const key = `${d.id}:${d.date}:${today}`;
    if (sent.includes(key)) continue;
    new Notification(`${relativeLabel(days)}: ${d.title}`, { body: d.course, tag: key });
    sent.push(key);
  }
  try {
    localStorage.setItem(KEY_SENT, JSON.stringify(sent.slice(-200)));
  } catch {
    // worst case we notify again next visit
  }
}
