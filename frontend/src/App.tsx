import { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router";
import type { Deadline } from "./types";
import CalendarPage from "./pages/CalendarPage";
import AddSyllabusPage from "./pages/AddSyllabusPage";

export default function App() {
  // Lives here so BOTH pages can use it (until Supabase takes over)
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);

  return (
    <BrowserRouter>
      <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <h1 style={{ marginRight: "auto" }}>CalendarAI Mini</h1>
        <NavLink to="/">Calendar</NavLink>
        <NavLink to="/add">Add syllabus</NavLink>
      </nav>

      <Routes>
        <Route
          path="/"
          element={<CalendarPage deadlines={deadlines} onClear={() => setDeadlines([])} />}
        />
        <Route
          path="/add"
          element={<AddSyllabusPage onAdd={(items) => setDeadlines((prev) => [...prev, ...items])} />}
        />
      </Routes>
    </BrowserRouter>
  );
}