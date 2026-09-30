import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import themePlugin from "@fullcalendar/react/themes/monarch";
import dayGridPlugin from "@fullcalendar/react/daygrid";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";
import "@fullcalendar/react/themes/monarch/palettes/purple.css";

type Deadline = {
  course: string;
  title: string;
  date: string;
  category: string;
  source: string;
};

type ParseResponse = {
  deadlines: Deadline[];
};

const CATEGORIES = ["assignment", "lab", "quiz", "midterm", "final", "other"];

// Colors handed out to courses in the order they're added
const PALETTE = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#7c3aed", "#ec4899", "#14b8a6", "#6b7280"];

function App() {
  const [syllabus, setSyllabus] = useState("");
  const [pending, setPending] = useState<Deadline[]>([]); // waiting for review
  const [deadlines, setDeadlines] = useState<Deadline[]>([]); // on the calendar
  const [autoAdd, setAutoAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function parseSyllabus() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: syllabus }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail);
        return;
      }
      const data: ParseResponse = await res.json();
      if (autoAdd) {
        setDeadlines((prev) => [...prev, ...data.deadlines]); // skip review
      } else {
        setPending(data.deadlines); // review one by one
      }
      setSyllabus("");
    } catch {
      setError("Couldn't reach the backend. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  // The popup always shows the first deadline in the queue
  const current = pending[0];

  function updateCurrent(field: keyof Deadline, value: string) {
    setPending((prev) => [{ ...prev[0], [field]: value }, ...prev.slice(1)]);
  }

  function confirmCurrent() {
    setDeadlines((prev) => [...prev, pending[0]]);
    setPending((prev) => prev.slice(1));
  }

  function deleteCurrent() {
    setPending((prev) => prev.slice(1));
  }

  function confirmAll() {
    setDeadlines((prev) => [...prev, ...pending]);
    setPending([]);
  }

  // Each course gets its own color
  const courses = [...new Set(deadlines.map((d) => d.course))];
  function colorFor(course: string) {
    return PALETTE[courses.indexOf(course) % PALETTE.length];
  }

  const events = deadlines.map((d) => ({
    title: `${d.course}: ${d.title}`,
    date: d.date,
    color: colorFor(d.course),
    extendedProps: { source: d.source },
  }));

  return (
    <div>
      <h1>CalendarAI Mini</h1>
      <textarea
        value={syllabus}
        onChange={(e) => setSyllabus(e.target.value)}
        placeholder="Paste syllabus text here"
        rows={8}
        cols={60}
      />
      <br />
      <label>
        <input
          type="checkbox"
          checked={autoAdd}
          onChange={(e) => setAutoAdd(e.target.checked)}
        />
        Skip review and add everything automatically
      </label>
      <br />
      <button onClick={parseSyllabus} disabled={loading || !syllabus}>
        {loading ? "Reading syllabus..." : "Find deadlines"}
      </button>
      <button onClick={() => setDeadlines([])}>Clear calendar</button>
      {error && <p>{error}</p>}

      {current && (
        <div style={overlay}>
          <div style={popup}>
            <p style={{ margin: 0, color: "#6b7280" }}>
              Deadline 1 of {pending.length}
            </p>
            <h2>Does this look right?</h2>

            <p style={{ marginBottom: 4 }}>From your syllabus:</p>
            <blockquote style={quote}>"{current.source}"</blockquote>

            <label>Course <input value={current.course} onChange={(e) => updateCurrent("course", e.target.value)} /></label>
            <br />
            <label>Title <input value={current.title} onChange={(e) => updateCurrent("title", e.target.value)} /></label>
            <br />
            <label>Date <input type="date" value={current.date} onChange={(e) => updateCurrent("date", e.target.value)} /></label>
            <br />
            <label>
              Type{" "}
              <select value={current.category} onChange={(e) => updateCurrent("category", e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button onClick={confirmCurrent}>Confirm</button>
              <button onClick={deleteCurrent}>Delete</button>
              <button onClick={confirmAll}>Confirm all {pending.length}</button>
            </div>
          </div>
        </div>
      )}

      <FullCalendar
        plugins={[themePlugin, dayGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ start: "prev,next today", center: "title", end: "" }}
        events={events}
        eventClick={(info) => {
          alert(`${info.event.title}\n\nFrom your syllabus:\n"${info.event.extendedProps.source}"`);
        }}
      />
    </div>
  );
}

// Popup styles
const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};
const popup: React.CSSProperties = {
  background: "white",
  color: "black",
  padding: 24,
  borderRadius: 12,
  width: 440,
  maxWidth: "90vw",
};
const quote: React.CSSProperties = {
  margin: "0 0 16px 0",
  padding: "8px 12px",
  borderLeft: "4px solid #7c3aed",
  background: "#f3f4f6",
  fontStyle: "italic",
};

export default App;