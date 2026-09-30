import FullCalendar from "@fullcalendar/react";
import themePlugin from "@fullcalendar/react/themes/monarch";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import { Link } from "react-router";
import type { Deadline } from "../types";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";
import "@fullcalendar/react/themes/monarch/palettes/purple.css";

const PALETTE = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#7c3aed", "#ec4899", "#14b8a6", "#6b7280"];

type Props = {
  deadlines: Deadline[];
  onClear: () => void;
};

export default function CalendarPage({ deadlines, onClear }: Props) {
  const courses = [...new Set(deadlines.map((d) => d.course))];
  const colorFor = (course: string) => PALETTE[courses.indexOf(course) % PALETTE.length];

  // Today's date as YYYY-MM-DD in your local time zone
  const today = new Date().toLocaleDateString("en-CA");
  const upcoming = deadlines
    .filter((d) => d.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const events = deadlines.map((d) => ({
    title: `${d.course}: ${d.title}`,
    date: d.date,
    color: colorFor(d.course),
    extendedProps: { source: d.source },
  }));

  if (deadlines.length === 0) {
    return (
      <div>
        <h2>No deadlines yet</h2>
        <Link to="/add">Add your first syllabus</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Upcoming</h2>
      <ul>
        {upcoming.map((d, i) => (
          <li key={i}>
            <span style={{ color: colorFor(d.course), fontWeight: "bold" }}>{d.course}</span>{" "}
            {d.title}: {d.date}
          </li>
        ))}
      </ul>

      <FullCalendar
        plugins={[themePlugin, dayGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ start: "prev,next today", center: "title", end: "" }}
        events={events}
        eventClick={(info) => {
          alert(`${info.event.title}\n\nFrom your syllabus:\n"${info.event.extendedProps.source}"`);
        }}
      />
      <button onClick={onClear}>Clear calendar</button>
    </div>
  );
}