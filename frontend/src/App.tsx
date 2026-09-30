import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient";
import type { Deadline } from "./types";
import CalendarPage from "./pages/CalendarPage";
import AddSyllabusPage from "./pages/AddSyllabusPage";
import LoginPage from "./pages/LoginPage";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);

  // On page load: are we already logged in? Then keep listening for login/logout
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Whenever the logged-in user changes, load their deadlines from the database
  useEffect(() => {
    if (!session) {
      setDeadlines([]);
      return;
    }
    supabase
      .from("deadlines")
      .select()
      .order("date")
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setDeadlines(data);
      });
  }, [session]);

  async function addDeadlines(items: Deadline[]) {
    const { data, error } = await supabase.from("deadlines").insert(items).select();
    if (error) {
      alert("Couldn't save: " + error.message);
      return;
    }
    setDeadlines((prev) => [...prev, ...data]);
  }

  async function clearDeadlines() {
    // RLS makes sure this only deletes YOUR rows
    const { error } = await supabase.from("deadlines").delete().gt("id", 0);
    if (error) {
      alert("Couldn't clear: " + error.message);
      return;
    }
    setDeadlines([]);
  }

  if (checking) return <p>Loading...</p>;
  if (!session) return <LoginPage />;

  return (
    <BrowserRouter>
      <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <h1 style={{ marginRight: "auto" }}>CalendarAI Mini</h1>
        <NavLink to="/">Calendar</NavLink>
        <NavLink to="/add">Add syllabus</NavLink>
        <span style={{ color: "#6b7280" }}>{session.user.email}</span>
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </nav>

      <Routes>
        <Route path="/" element={<CalendarPage deadlines={deadlines} onClear={clearDeadlines} />} />
        <Route path="/add" element={<AddSyllabusPage onAdd={addDeadlines} />} />
      </Routes>
    </BrowserRouter>
  );
}