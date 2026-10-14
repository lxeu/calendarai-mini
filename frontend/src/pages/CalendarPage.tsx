import { useState, type CSSProperties } from "react";
import FullCalendar from "@fullcalendar/react";
import themePlugin from "@fullcalendar/react/themes/monarch";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import { Link } from "react-router";
import type { Deadline } from "../types";
import EventFormModal from "../components/EventFormModal";
import Countdown from "../components/Countdown";
import CrunchStrip from "../components/CrunchStrip";
import DeadlineModal from "../components/DeadlineModal";
import Modal from "../components/Modal";
import Reminders from "../components/Reminders";
import { IconCalendar, IconDownload, IconFilePlus, IconPlus, IconTrash } from "../components/Icons";
import { courseColor, listCourses } from "../lib/courses";
import { daysBetween, formatLong, formatShort, relativeLabel, todayISO } from "../lib/dates";
import { downloadICS } from "../lib/ics";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";
import "@fullcalendar/react/themes/monarch/palettes/purple.css";
import "../styles/calendar.css";

type Props = {
  deadlines: Deadline[];
  onAdd: (items: Deadline[]) => void;
  onSave: (changes: Deadline) => void;
  onDelete: (id: number) => void;
  onClear: () => void;
};

const cssVars = (vars: Record<string, string | number>) => vars as CSSProperties;

export default function CalendarPage({ deadlines, onAdd, onSave, onDelete, onClear }: Props) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState<Deadline | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [adding, setAdding] = useState(false);

  const courses = listCourses(deadlines);
  const colorFor = (course: string) => courseColor(courses, course);

  // Today's date as YYYY-MM-DD in your local time zone
  const today = todayISO();
  const visible = deadlines.filter((d) => !hidden.includes(d.course));
  const ahead = visible.filter((d) => d.date >= today && !d.done).sort((a, b) => a.date.localeCompare(b.date));
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

  const addEventModal = adding && (
    <EventFormModal courses={courses} onSubmit={(item) => onAdd([item])} onClose={() => setAdding(false)} />
  );

  if (deadlines.length === 0) {
    return (
      <div className="cal-page">
        <header className="page-head">
          <div>
            <p className="muted">{formatLong(today)}</p>
            <h1 className="page-title">Calendar</h1>
          </div>
        </header>
        <div className="empty">
          <span className="icon-tile">
            <IconCalendar />
          </span>
          <h2 className="empty-title">No deadlines yet</h2>
          <p className="muted">
            Add a course syllabus and its assignments, labs, quizzes and exams show up here. You check each one
            before it's saved.
          </p>
          <div className="empty-actions">
            <Link to="/add" className="btn btn-primary">
              <IconFilePlus /> Add syllabus
            </Link>
            <button className="btn" onClick={() => setAdding(true)}>
              <IconPlus /> Add event manually
            </button>
          </div>
        </div>
        {addEventModal}
      </div>
    );
  }

  return (
    <div className="cal-page">
      <header className="page-head">
        <div>
          <p className="muted">{formatLong(today)}</p>
          <h1 className="page-title">Calendar</h1>
        </div>
        <div className="head-actions">
          <button
            className="btn"
            onClick={() => downloadICS(visible)}
            disabled={visible.length === 0}
            title="Download an .ics file for Google, Apple or Outlook Calendar"
          >
            <IconDownload /> Export .ics
          </button>
          <button className="btn" onClick={() => setAdding(true)}>
            <IconPlus /> Add event
          </button>
          <Link to="/add" className="btn btn-primary">
            <IconFilePlus /> Add syllabus
          </Link>
        </div>
      </header>

      <div className="filters" role="group" aria-label="Show or hide courses">
        {courses.map((c) => {
          const on = !hidden.includes(c);
          return (
            <button
              key={c}
              className={`chip course-toggle${on ? " on" : ""}`}
              style={cssVars({ "--c": colorFor(c) })}
              aria-pressed={on}
              onClick={() => toggleCourse(c)}
            >
              <i className="dot" />
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

      <div className="cal-layout">
        <section className="panel cal-panel" aria-label="Month">
          <FullCalendar
            plugins={[themePlugin, dayGridPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ start: "title", center: "", end: "today prev,next" }}
            events={events}
            borderless
            dayMaxEvents={3}
            eventClass="cal-event"
            dayCellClass={(arg) => (arg.isToday ? "cal-today" : undefined)}
            eventContent={(arg) => (
              <span
                className={`ev-pill${arg.event.extendedProps.deadline.done ? " is-done" : ""}`}
                style={cssVars({ "--c": arg.event.color })}
              >
                <span className="ev-text">{arg.event.title}</span>
              </span>
            )}
            eventClick={(info) => setSelected(info.event.extendedProps.deadline as Deadline)}
          />
        </section>

        <aside className="panel side">
          <section className="side-section next" aria-label="Next up">
            <div className="section-head">
              <h3 className="section-title">Next up</h3>
              {next && <When days={daysBetween(today, next.date)} />}
            </div>
            {next ? (
              <>
                <button className="next-title link-reset" onClick={() => setSelected(next)}>
                  {next.title}
                </button>
                <p className="row-meta" style={cssVars({ "--c": colorFor(next.course) })}>
                  <i className="dot" />
                  <span>
                    {next.course} · {next.category} · {formatLong(next.date)}
                  </span>
                </p>
                <Countdown date={next.date} />
              </>
            ) : (
              <p className="muted">
                No upcoming deadlines{hidden.length > 0 ? " in the courses you're showing" : ""}.
              </p>
            )}
          </section>

          <Reminders
            deadlines={visible}
            colorFor={colorFor}
            onOpen={setSelected}
            onDone={(d) => onSave({ ...d, done: true })}
          />

          <section className="side-section" aria-label="Upcoming">
            <div className="section-head">
              <h3 className="section-title">Upcoming</h3>
              <span className="muted">
                {ahead.length > upcoming.length ? `${upcoming.length} of ${ahead.length}` : `${ahead.length}`}
              </span>
            </div>
            {upcoming.length === 0 ? (
              <p className="muted">Nothing upcoming.</p>
            ) : (
              <ol className="rows">
                {upcoming.map((d, i) => {
                  const f = formatShort(d.date);
                  return (
                    <li key={d.id ?? `new-${i}`} className="row" style={cssVars({ "--c": colorFor(d.course) })}>
                      <button className="row-main" onClick={() => setSelected(d)}>
                        <span className="row-date">
                          {f.month} {f.day}
                        </span>
                        <span className="row-text">
                          <span className="row-title">{d.title}</span>
                          <span className="row-meta">
                            <i className="dot" /> {d.course}
                          </span>
                        </span>
                        <When days={daysBetween(today, d.date)} />
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="side-section">
            <CrunchStrip deadlines={visible} today={today} colorFor={colorFor} />
          </section>

          <section className="side-section" aria-label="Summary">
            <dl className="stats">
              <div>
                <dt>Upcoming</dt>
                <dd>{ahead.length}</dd>
              </div>
              <div>
                <dt>Next 7 days</dt>
                <dd>{thisWeek}</dd>
              </div>
              <div>
                <dt>Exams ahead</dt>
                <dd>{exams}</dd>
              </div>
            </dl>
            <div className="meter">
              <div className="meter-head">
                <span>Done or past</span>
                <span>
                  {done} of {visible.length}
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
        </aside>
      </div>

      <div className="danger-zone">
        <button className="btn btn-sm btn-quiet btn-danger-text" onClick={() => setConfirmingClear(true)}>
          <IconTrash size={14} /> Clear calendar
        </button>
      </div>

      {selected && (
        <DeadlineModal
          deadline={selected}
          color={colorFor(selected.course)}
          courses={courses}
          onSave={onSave}
          onDelete={() => selected.id && onDelete(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}

      {addEventModal}

      {confirmingClear && (
        <Modal label="Clear calendar" onClose={() => setConfirmingClear(false)} className="confirm-modal">
          <h2 className="modal-title">Clear your calendar?</h2>
          <p className="muted">
            This deletes all {deadlines.length} deadline{deadlines.length === 1 ? "" : "s"}. It can't be undone.
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setConfirmingClear(false)} autoFocus>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                setConfirmingClear(false);
                onClear();
              }}
            >
              Delete all deadlines
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// "Today" / "in 3 days"; due today or tomorrow is marked urgent
function When({ days }: { days: number }) {
  if (Number.isNaN(days)) return null;
  return <span className={`when${days <= 1 ? " when-hot" : ""}`}>{relativeLabel(days)}</span>;
}
