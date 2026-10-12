import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient";
import type { Deadline } from "./types";
import CalendarPage from "./pages/CalendarPage";
import AddSyllabusPage from "./pages/AddSyllabusPage";
import LoginPage from "./pages/LoginPage";
import StudyBuddyPage from "./pages/StudyBuddyPage";
import Background from "./components/Background";
import CommandPalette from "./components/CommandPalette";
import DeadlineModal from "./components/DeadlineModal";
import LoadingScreen from "./components/LoadingScreen";
import NavBar from "./components/NavBar";
import Toaster from "./components/Toaster";
import { confetti } from "./lib/confetti";
import { courseColor, listCourses } from "./lib/courses";
import { downloadICS } from "./lib/ics";
import { modKey } from "./lib/platform";
import { sendDueNotifications } from "./lib/reminders";
import { toast } from "./lib/toast";

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
      toast("Couldn't save: " + error.message, "error");
      return;
    }
    setDeadlines((prev) => [...prev, ...data]);
    confetti({ count: items.length > 1 ? 160 : 45 });
    if (items.length > 1) toast(`Added ${items.length} deadlines to your calendar`, "success");
  }

  // Edit a deadline (also used for marking it done)
  async function saveDeadline(changes: Deadline) {
    const { id, course, title, date, category, done } = changes;
    const { data, error } = await supabase
      .from("deadlines")
      .update({ course, title, date, category, done: done ?? false })
      .eq("id", id)
      .select();
    // RLS silently skips rows you aren't allowed to edit, so an empty result means "not saved"
    if (error || data.length === 0) {
      toast("Couldn't save: " + (error?.message ?? "editing isn't enabled yet (run supabase/edit_and_share.sql)"), "error");
      return;
    }
    const before = deadlines.find((d) => d.id === id);
    setDeadlines((prev) => prev.map((d) => (d.id === id ? data[0] : d)));
    if (!!before?.done !== !!done) toast(done ? `Nice, "${title}" is done` : "Marked not done", "success");
    else toast("Saved", "success");
  }

  async function deleteDeadline(id: number) {
    const { error } = await supabase.from("deadlines").delete().eq("id", id);
    if (error) {
      toast("Couldn't delete: " + error.message, "error");
      return;
    }
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
    toast("Deleted", "info");
  }

  async function clearDeadlines() {
    // RLS makes sure this only deletes YOUR rows
    const { error } = await supabase.from("deadlines").delete().gt("id", 0);
    if (error) {
      toast("Couldn't clear: " + error.message, "error");
      return;
    }
    setDeadlines([]);
    toast("Calendar cleared", "info");
  }

  return (
    <>
      <Background />
      {checking ? (
        <LoadingScreen />
      ) : !session ? (
        <LoginPage />
      ) : (
        <BrowserRouter>
          <Shell
            session={session}
            deadlines={deadlines}
            onAdd={addDeadlines}
            onSave={saveDeadline}
            onDelete={deleteDeadline}
            onClear={clearDeadlines}
          />
        </BrowserRouter>
      )}
      <Toaster />
    </>
  );
}

type ShellProps = {
  session: Session;
  deadlines: Deadline[];
  onAdd: (items: Deadline[]) => void;
  onSave: (changes: Deadline) => void;
  onDelete: (id: number) => void;
  onClear: () => void;
};

// Everything you see once logged in: nav, pages, and the Cmd+K palette
function Shell({ session, deadlines, onAdd, onSave, onDelete, onClear }: ShellProps) {
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [focused, setFocused] = useState<Deadline | null>(null);
  const courses = listCourses(deadlines);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // don't open on top of the review popup; leaving mid-review would drop unsaved deadlines
        if (document.querySelector("[data-blocking-modal]")) return;
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Browser reminders (if turned on): check now, then every hour while the tab is open
  useEffect(() => {
    sendDueNotifications(deadlines);
    const timer = setInterval(() => sendDueNotifications(deadlines), 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, [deadlines]);

  function exportAll() {
    downloadICS(deadlines);
    toast(`Exported ${deadlines.length} deadlines as an .ics file`, "success");
  }

  const meta = session.user.user_metadata ?? {};
  const avatarUrl: string | undefined = meta.avatar_url ?? meta.picture;

  return (
    <div className="shell">
      <NavBar
        email={session.user.email ?? ""}
        avatarUrl={avatarUrl}
        onSignOut={() => supabase.auth.signOut()}
        onOpenPalette={() => setPaletteOpen(true)}
      />

      <main className="container page" key={location.pathname}>
        <Routes>
          <Route path="/" element={<CalendarPage deadlines={deadlines} onAdd={onAdd} onSave={onSave} onDelete={onDelete} onClear={onClear} />} />
          <Route path="/add" element={<AddSyllabusPage userId={session.user.id} deadlines={deadlines} onAdd={onAdd} />} />
          <Route path="/buddy" element={<StudyBuddyPage session={session} deadlines={deadlines} />} />
        </Routes>
      </main>

      <footer className="container foot">
        <span>CalendarAI Mini</span>
        <span>
          Press <kbd>{modKey} K</kbd> to search
        </span>
      </footer>

      {paletteOpen && (
        <CommandPalette
          deadlines={deadlines}
          onClose={() => setPaletteOpen(false)}
          onOpenDeadline={setFocused}
          onExport={exportAll}
          onSignOut={() => supabase.auth.signOut()}
        />
      )}
      {focused && (
        <DeadlineModal
          deadline={focused}
          color={courseColor(courses, focused.course)}
          courses={courses}
          onSave={onSave}
          onDelete={() => focused.id && onDelete(focused.id)}
          onClose={() => setFocused(null)}
        />
      )}
    </div>
  );
}
