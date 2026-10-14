import { supabase } from "../lib/supabaseClient";
import { useRef, useState, type DragEvent } from "react";
import { useNavigate } from "react-router";
import { API, type Deadline, type ParseResponse, type SharedSyllabus } from "../types";
import ReviewPopup from "../components/ReviewPopup";
import SharedSyllabi from "../components/SharedSyllabi";
import { isPersonal, normalizeCourse } from "../lib/courses";
import { toast } from "../lib/toast";
import { IconAlert, IconArrowRight, IconUpload } from "../components/Icons";

type Props = {
  userId: string;
  deadlines: Deadline[];
  onAdd: (items: Deadline[]) => void;
};

// Share what you confirmed: one shared syllabus per course, replacing your previous share of it
async function shareWithClassmates(userId: string, items: Deadline[], instructor: string) {
  const byCourse = new Map<string, Deadline[]>();
  for (const { course, title, date, category, source } of items) {
    const c = normalizeCourse(course);
    if (!c || isPersonal(course)) continue;
    byCourse.set(c, [...(byCourse.get(c) ?? []), { course, title, date, category, source }]);
  }
  if (byCourse.size === 0) return;
  const rows = [...byCourse].map(([course, list]) => ({
    course,
    deadlines: list,
    instructor: instructor.trim() || null,
    uploaded_by: userId,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("shared_syllabi").upsert(rows, { onConflict: "course,uploaded_by" });
  if (error) console.error(error);
  else toast(`Shared ${[...byCourse.keys()].join(", ")} with classmates`, "success");
}

export default function AddSyllabusPage({ userId, deadlines, onAdd }: Props) {
  const [syllabus, setSyllabus] = useState("");
  const [pending, setPending] = useState<Deadline[]>([]);
  const [autoAdd, setAutoAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [share, setShare] = useState(true);
  // Deadlines that came from a classmate's share aren't re-shared
  const [fromShared, setFromShared] = useState(false);
  // Who teaches it, as read from the syllabus; shown to classmates so they can pick their section
  const [instructor, setInstructor] = useState("");
  const confirmed = useRef<Deadline[]>([]);
  const navigate = useNavigate();

  async function sendRequest(makeRequest: () => Promise<Response>) {
    setLoading(true);
    setError("");
    try {
      const res = await makeRequest();
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail);
        return;
      }
      const data: ParseResponse = await res.json();
      setFromShared(false);
      setInstructor(data.instructor ?? "");
      if (autoAdd) {
        onAdd(data.deadlines);
        if (share) shareWithClassmates(userId, data.deadlines, data.instructor ?? "");
        navigate("/"); // straight to the calendar
      } else {
        setPending(data.deadlines);
      }
      setSyllabus("");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }
    // Grab the logged-in user's token to prove who we are
  async function authHeader() {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token}` };
  }

  function parseText() {
    sendRequest(async () =>
      fetch(`${API}/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ text: syllabus }),
      })
    );
  }

  function parsePdf(file: File) {
    const form = new FormData();
    form.append("file", file);
    sendRequest(async () =>
      fetch(`${API}/parse-pdf`, {
        method: "POST",
        headers: await authHeader(),
        body: form,
      })
    );
  }

  // Drag-and-drop accepts any file, so check it's a PDF before uploading
  function handleFile(file: File) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("That file isn't a PDF. Upload a .pdf, or paste the text instead.");
      return;
    }
    parsePdf(file);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    if (loading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  // Add a classmate's syllabus, skipping anything already on your calendar
  function addShared(s: SharedSyllabus) {
    const have = new Set(deadlines.map((d) => `${normalizeCourse(d.course)}|${d.title.trim().toLowerCase()}|${d.date}`));
    const fresh = s.deadlines.filter((d) => !have.has(`${normalizeCourse(d.course)}|${d.title.trim().toLowerCase()}|${d.date}`));
    if (fresh.length === 0) {
      toast(`You already have all of ${s.course}'s deadlines`, "info");
      return;
    }
    supabase.rpc("use_shared_syllabus", { p_id: s.id }).then(({ error }) => error && console.error(error));
    setError("");
    setFromShared(true);
    if (autoAdd) {
      onAdd(fresh);
      navigate("/");
    } else {
      setPending(fresh);
    }
  }

  // When the review queue runs out, share what was confirmed and go back to the calendar
  function finishReview(extra: Deadline[] = []) {
    const all = [...confirmed.current, ...extra];
    confirmed.current = [];
    if (share && !fromShared) shareWithClassmates(userId, all, instructor);
    navigate("/");
  }

  function finishIfLast() {
    if (pending.length === 1) finishReview();
  }

  return (
    <div className="add-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Add syllabus</h1>
          <p className="muted page-sub">
            Upload a PDF or paste the text. Assignments, labs, quizzes and exams are pulled out, and you review each one
            before it's added to your calendar.
          </p>
        </div>
      </header>

      <SharedSyllabi userId={userId} disabled={loading || pending.length > 0} onUse={addShared} />

      <div className="add-grid">
        <label
          className={`panel dropzone${dragging ? " is-drag" : ""}${loading ? " is-disabled" : ""}`}
          onDragEnter={(e) => {
            e.preventDefault();
            if (!loading) setDragging(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
          }}
          onDrop={onDrop}
        >
          <input
            className="sr-only"
            type="file"
            accept=".pdf"
            disabled={loading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <span className="icon-tile">
            <IconUpload />
          </span>
          <span className="dz-title">{dragging ? "Drop to upload" : "Upload a PDF"}</span>
          <span className="muted">
            Drag it here or <span className="dz-link">choose a file</span>
          </span>
          <span className="dz-hint muted">The PDF needs selectable text. Scanned pages won't work.</span>
        </label>

        <div className="panel paste">
          <div className="section-head">
            <label className="section-title" htmlFor="syllabus-text">
              Paste text
            </label>
            <span className="muted tabular">{syllabus.length.toLocaleString()} characters</span>
          </div>
          <textarea
            id="syllabus-text"
            className="input paste-area"
            value={syllabus}
            onChange={(e) => setSyllabus(e.target.value)}
            placeholder="Paste the schedule or assignment list from your syllabus"
            rows={9}
          />
          <div className="paste-foot">
            <button className="btn btn-primary" onClick={parseText} disabled={loading || !syllabus}>
              {loading ? (
                <>
                  <span className="spinner" /> Finding deadlines
                </>
              ) : (
                <>
                  Find deadlines <IconArrowRight />
                </>
              )}
            </button>
          </div>
        </div>

        {loading && (
          <div className="busy-overlay" role="status" aria-live="polite">
            <span className="spinner" />
            <div>
              <p className="section-title">Reading your syllabus</p>
              <p className="muted">Finding assignments, labs, quizzes and exams. Long syllabi take longer.</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="notice notice-error" role="alert">
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      <fieldset className="options">
        <legend className="section-title">Options</legend>
        <label className="option">
          <input type="checkbox" checked={autoAdd} onChange={(e) => setAutoAdd(e.target.checked)} />
          <span>
            <span className="option-label">Add without reviewing</span>
            <span className="muted">Every deadline found goes straight onto your calendar.</span>
          </span>
        </label>
        <label className="option">
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
          <span>
            <span className="option-label">Share with classmates</span>
            <span className="muted">
              After you review them, the course's deadlines become searchable by other students in it. Your name and
              email are never shared.
            </span>
          </span>
        </label>
      </fieldset>

      {pending.length > 0 && (
        <ReviewPopup
          pending={pending}
          instructor={share && !fromShared ? instructor : undefined}
          onInstructorChange={setInstructor}
          onUpdate={(field, value) =>
            setPending((prev) => [{ ...prev[0], [field]: value }, ...prev.slice(1)])
          }
          onConfirm={() => {
            onAdd([pending[0]]);
            confirmed.current.push(pending[0]);
            setPending((prev) => prev.slice(1));
            finishIfLast();
          }}
          onDelete={() => {
            setPending((prev) => prev.slice(1));
            finishIfLast();
          }}
          onConfirmAll={() => {
            onAdd(pending);
            setPending([]);
            finishReview(pending);
          }}
        />
      )}
    </div>
  );
}
