import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import themePlugin from "@fullcalendar/react/themes/monarch";
import dayGridPlugin from "@fullcalendar/react/daygrid";

// Calendar styles
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";
import "@fullcalendar/react/themes/monarch/palettes/purple.css";

// Matches the templates in main.py
type Deadline = {
  course: string;
  title: string;
  date: string;
  category: string;
};

type ParseResponse = {
  deadlines: Deadline[];
};

function App() {
  const [syllabus, setSyllabus] = useState("");
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
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
      // Add the new deadlines to the ones we already have
      setDeadlines((prev) => [...prev, ...data.deadlines]);
      setSyllabus(""); // empty the box, ready for the next syllabus
    } catch {
      setError("Couldn't reach the backend. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  // Turn our deadlines into the format FullCalendar expects
  const events = deadlines.map((d) => ({
        title: `${d.course}: ${d.title}`,
    date: d.date,
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
      <button onClick={parseSyllabus} disabled={loading || !syllabus}>
        {loading ? "Reading syllabus..." : "Find deadlines"}
      </button>
      <button onClick={() => setDeadlines([])}>Clear calendar</button>
      {error && <p>{error}</p>}

      <FullCalendar
        plugins={[themePlugin, dayGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          start: "prev,next today",
          center: "title",
          end: "",
        }}
        events={events}
      />
    </div>
  );
}

export default App;