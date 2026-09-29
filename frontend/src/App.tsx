import { useState } from "react";

// Matches the templates in main.py
type Deadline = {
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
    setDeadlines([]);
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
      setDeadlines(data.deadlines);
    } catch {
      setError("Couldn't reach the backend. Is it running?");
    } finally {
      setLoading(false);
    }
  }

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
      {error && <p>{error}</p>}
      <ul>
        {deadlines.map((d, i) => (
          <li key={i}>
            {d.date}: {d.title} ({d.category})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;