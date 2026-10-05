import { useState, type CSSProperties, type ReactNode } from "react";
import FullCalendar from "@fullcalendar/react";
import themePlugin from "@fullcalendar/react/themes/monarch";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import { Link } from "react-router";
import type { Deadline } from "../types";
import Countdown from "../components/Countdown";
import CountUp from "../components/CountUp";
import CrunchStrip from "../components/CrunchStrip";
import DeadlineModal from "../components/DeadlineModal";
import Modal from "../components/Modal";
import {
  IconArrowRight, IconClock, IconDownload, IconFlame, IconPlus, IconSparkles, IconTarget, IconTrash,
} from "../components/Icons";
import { courseColor, listCourses } from "../lib/courses";
import { daysBetween, formatLong, formatShort, relativeLabel, todayISO } from "../lib/dates";
import { downloadICS } from "../lib/ics";
import { tiltHandlers } from "../lib/motion";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";
import "@fullcalendar/react/themes/monarch/palettes/purple.css";
import "../styles/calendar.css";

type Props = {
  deadlines: Deadline[];
  onClear: () => void;
};

const cssVars = (vars: Record<string, string | number>) => vars as CSSProperties;

export default function CalendarPage({ deadlines, onClear }: Props) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState<Deadline | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const courses = listCourses(deadlines);
  const colorFor = (course: string) => courseColor(courses, course);

  // Today's date as YYYY-MM-DD in your local time zone
  const today = todayISO();
  const visible = deadlines.filter((d) => !hidden.includes(d.course));
  const ahead = visible.filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = ahead.slice(0, 5);
  const next = ahead[0];
  const thisWeek = ahead.filter((d) => daysBetween(today, d.date) < 7).length;
  const exams = ahead.filter((d) => d.category === "midterm" || d.category === "final").length;
  const done = visible.length - ahead.length;

  const events = visible.map((d) => ({
    title: `${d.course}: ${d.title}`,
    date: d.date,
    color: colorFor(d.course),
    extendedProps: { source: d.source, deadline: d },
  }));

  function toggleCourse(course: string) {
    setHidden((prev) => (prev.includes(course) ? prev.filter((c) => c !== course) : [...prev, course]));
  }

  if (deadlines.length === 0) {
    return (
      <div className="empty">
        <div className="empty-art reveal" aria-hidden="true">
          <div className="empty-cal">
            {Array.from({ length: 28 }, (_, i) => (
              <span key={i} className={[3, 9, 12, 18, 24].includes(i) ? "on" : ""} />
            ))}
          </div>
          <span className="empty-orb o1" />
          <span className="empty-orb o2" />
          <span className="empty-orb o3" />
        </div>
        <h2 className="page-title reveal" style={cssVars({ "--i": 1 })}>
          No deadlines <span className="serif-accent">yet</span>
        </h2>
        <p className="page-sub reveal" style={cssVars({ "--i": 2 })}>
          Drop in a syllabus and every assignment, quiz and exam shows up here in seconds.
        </p>
        <Link to="/add" className="btn btn-primary btn-lg reveal" style={cssVars({ "--i": 3 })}>
          Add your first syllabus <IconArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="cal-page">
      <header className="page-head page-head-row reveal">
        <div>
          <span className="eyebrow">
            <span className="live-dot" /> {formatLong(today)}
          </span>
          <h1 className="page-title">
            Your semester, <span className="serif-accent">at a glance</span>
          </h1>
        </div>
        <div className="head-actions">
          <button
            className="btn btn-ghost"
            onClick={() => downloadICS(visible)}
            disabled={visible.length === 0}
            title="Download as an .ics file for Google, Apple or Outlook Calendar"
          >
            <IconDownload size={16} /> Export .ics
          </button>
          <Link to="/add" className="btn btn-primary">
            <IconPlus size={16} /> Add syllabus
          </Link>
        </div>
      </header>

      <div className="filters reveal" style={cssVars({ "--i": 1 })} role="group" aria-label="Show or hide courses">
        <span className="filters-label">Courses</span>
        {courses.map((c) => {
          const on = !hidden.includes(c);
          return (
            <button
              key={c}
              className={`course-chip toggle${on ? " on" : ""}`}
              style={cssVars({ "--c": colorFor(c) })}
              aria-pressed={on}
              onClick={() => toggleCourse(c)}
            >
              <i />
              {c}
              <span className="chip-count">{deadlines.filter((d) => d.course === c).length}</span>
            </button>
          );
        })}
        {hidden.length > 0 && (
          <button className="link-btn" onClick={() => setHidden([])}>
            Show all
          </button>
        )}
      </div>

      <div className="bento">
        <section className="card next-card reveal" style={cssVars({ "--i": 2 })}>
          <span className="next-ring" aria-hidden="true" />
          {next ? (
            <>
              <div className="next-top">
                <span className="eyebrow">
                  <span className="live-dot" /> Next up
                </span>
                <When days={daysBetween(today, next.date)} />
              </div>
              <div className="next-meta">
                <span className="course-chip" style={cssVars({ "--c": colorFor(next.course) })}>
                  <i />
                  {next.course}
                </span>
                <span className="tag">{next.category}</span>
              </div>
              <h2 className="next-title">
                <button className="link-reset" onClick={() => setSelected(next)}>
                  {next.title}
                </button>
              </h2>
              <p className="next-date">{formatLong(next.date)}</p>
              <Countdown date={next.date} />
            </>
          ) : (
            <div className="next-empty">
              <span className="next-empty-icon">
                <IconSparkles size={26} />
              </span>
              <h2 className="next-title">All clear</h2>
              <p className="next-date">
                Nothing coming up{hidden.length > 0 ? " in the courses you're showing" : ""}. Enjoy it.
              </p>
            </div>
          )}
          <div className="meter">
            <div className="meter-head">
              <span>Semester progress</span>
              <span>
                <b>{done}</b> of {visible.length} behind you
              </span>
            </div>
            <div
              className="meter-track"
              role="progressbar"
              aria-label="Deadlines behind you"
              aria-valuemin={0}
              aria-valuemax={visible.length}
              aria-valuenow={done}
            >
              <span className="meter-fill" style={{ width: `${visible.length ? (done / visible.length) * 100 : 0}%` }} />
            </div>
          </div>
        </section>

        <div className="stats">
          <StatTile i={3} icon={<IconTarget size={18} />} label="Upcoming" value={ahead.length} sub="deadlines ahead" />
          <StatTile i={4} icon={<IconClock size={18} />} label="Next 7 days" value={thisWeek} sub={thisWeek === 1 ? "deadline" : "deadlines"} />
          <StatTile i={5} icon={<IconFlame size={18} />} label="Exams ahead" value={exams} sub="midterms & finals" />
        </div>

        <section className="card crunch-card reveal" style={cssVars({ "--i": 6 })}>
          <CrunchStrip deadlines={visible} today={today} colorFor={colorFor} />
        </section>

        <section className="card cal-card reveal" style={cssVars({ "--i": 7 })}>
          <FullCalendar
            plugins={[themePlugin, dayGridPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ start: "prev,next today", center: "title", end: "" }}
            events={events}
            borderless
            dayMaxEvents={3}
            eventClass="cal-event"
            dayCellClass={(arg) => (arg.isToday ? "cal-today" : undefined)}
            eventContent={(arg) => (
              <span className="ev-pill" style={cssVars({ "--c": arg.event.color })}>
                <i className="ev-dot" />
                <span className="ev-text">{arg.event.title}</span>
              </span>
            )}
            eventClick={(info) => setSelected(info.event.extendedProps.deadline as Deadline)}
          />
        </section>

        <aside className="card upcoming-card reveal" style={cssVars({ "--i": 8 })}>
          <div className="card-head">
            <div>
              <h3 className="card-title">Upcoming</h3>
              <p className="card-sub">
                {ahead.length > upcoming.length ? `Next ${upcoming.length} of ${ahead.length}` : `${ahead.length} ahead`}
              </p>
            </div>
          </div>
          {upcoming.length === 0 ? (
            <p className="card-sub">Nothing upcoming.</p>
          ) : (
            <ol className="timeline">
              {upcoming.map((d, i) => {
                const f = formatShort(d.date);
                return (
                  <li key={d.id ?? `new-${i}`} style={cssVars({ "--i": i })}>
                    <button className="tl-item" style={cssVars({ "--c": colorFor(d.course) })} onClick={() => setSelected(d)}>
                      <span className="tl-date">
                        <span>{f.month}</span>
                        <b>{f.day}</b>
                      </span>
                      <span className="tl-body">
                        <span className="tl-course">
                          <i />
                          {d.course}
                        </span>
                        <span className="tl-title">{d.title}</span>
                      </span>
                      <When days={daysBetween(today, d.date)} compact />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </aside>
      </div>

      <div className="danger-zone">
        <button className="btn btn-danger btn-sm" onClick={() => setConfirmingClear(true)}>
          <IconTrash size={15} /> Clear calendar
        </button>
      </div>

      {selected && (
        <DeadlineModal deadline={selected} color={colorFor(selected.course)} onClose={() => setSelected(null)} />
      )}

      {confirmingClear && (
        <Modal label="Clear calendar" onClose={() => setConfirmingClear(false)} className="confirm-modal">
          <span className="confirm-icon">
            <IconTrash size={22} />
          </span>
          <h2>Clear your whole calendar?</h2>
          <p>
            This deletes all {deadlines.length} deadline{deadlines.length === 1 ? "" : "s"}. It can't be undone.
          </p>
          <div className="dm-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmingClear(false)} autoFocus>
              Cancel
            </button>
            <button
              className="btn btn-danger-solid"
              onClick={() => {
                setConfirmingClear(false);
                onClear();
              }}
            >
              <IconTrash size={16} /> Clear everything
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatTile({ i, icon, label, value, sub }: { i: number; icon: ReactNode; label: string; value: number; sub: string }) {
  return (
    <div className="card stat tilt glow reveal" style={cssVars({ "--i": i })} {...tiltHandlers}>
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        <CountUp value={value} />
      </span>
      <span className="stat-sub">{sub}</span>
    </div>
  );
}

// "Today" / "in 3 days" badge; due today or tomorrow gets the urgent styling
function When({ days, compact = false }: { days: number; compact?: boolean }) {
  if (Number.isNaN(days)) return null;
  const hot = days <= 1;
  return (
    <span className={`when${hot ? " when-hot" : days <= 3 ? " when-warm" : ""}${compact ? " when-compact" : ""}`}>
      {hot && <IconFlame size={13} />}
      {relativeLabel(days)}
    </span>
  );
}
