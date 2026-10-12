import { supabase } from "../lib/supabaseClient";
import { useRef, useState, type CSSProperties, type DragEvent } from "react";
import { useNavigate } from "react-router";
import { API, type Deadline, type ParseResponse, type SharedSyllabus } from "../types";
import ReviewPopup from "../components/ReviewPopup";
import SharedSyllabi from "../components/SharedSyllabi";
import { isPersonal, normalizeCourse } from "../lib/courses";
import { toast } from "../lib/toast";
import ScanLoader from "../components/ScanLoader";
import { IconAlert, IconArrowRight, IconCalendar, IconCheck, IconFile, IconSparkles, IconUpload } from "../components/Icons";

type Props = {
  userId: string;
  deadlines: Deadline[];
  onAdd: (items: Deadline[]) => void;
};

// Share what you confirmed: one shared syllabus per course, replacing your previous share of it
async function shareWithClassmates(userId: string, items: Deadline[]) {
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
      if (autoAdd) {
        onAdd(data.deadlines);
        if (share) shareWithClassmates(userId, data.deadlines);
        navigate("/"); // straight to the calendar
      } else {
        setPending(data.deadlines);
      }
      setSyllabus("");
    } catch {
      setError("Couldn't reach the backend. Is it running?");
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
      setError("That file isn't a PDF. Try a .pdf file, or paste the text instead.");
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
    if (share && !fromShared) shareWithClassmates(userId, all);
    navigate("/");
  }

  function finishIfLast() {
    if (pending.length === 1) finishReview();
  }

  return (
    <div className="add-page">
      <header className="page-head reveal">
        <span className="eyebrow">
          <IconSparkles size={14} /> AI deadline finder
        </span>
        <h1 className="page-title">
          Add a <span className="serif-accent">syllabus</span>
        </h1>
        <p className="page-sub">
          Upload the PDF or paste the text. I'll pull out every assignment, lab, quiz and exam, and you check
          each one before it lands on your calendar.
        </p>
      </header>

      <SharedSyllabi userId={userId} disabled={loading || pending.length > 0} onUse={addShared} />

      <div className="add-grid">
        <label
          className={`dropzone card glow reveal${dragging ? " is-drag" : ""}${loading ? " is-disabled" : ""}`}
          style={{ "--i": 1 } as CSSProperties}
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
          <span className="dz-border" aria-hidden="true" />
          <span className="dz-icon">
            <IconUpload size={30} />
          </span>
          <span className="dz-title">{dragging ? "Let go to upload" : "Drop your PDF here"}</span>
          <span className="dz-sub">
            or <span className="dz-link">browse your files</span>
          </span>
          <span className="dz-hint">
            <IconFile size={14} /> Works with PDFs that have selectable text
          </span>
        </label>

        <div className="paste-card card glow reveal" style={{ "--i": 2 } as CSSProperties}>
          <div className="card-head">
            <div>
              <h3 className="card-title">Or paste the text</h3>
              <p className="card-sub">Schedules, assignment lists, anything with dates.</p>
            </div>
            <span className="char-count">{syllabus.length.toLocaleString()} chars</span>
          </div>
          <textarea
            className="paste-area"
            value={syllabus}
            onChange={(e) => setSyllabus(e.target.value)}
            placeholder="Paste syllabus text here"
            rows={9}
            aria-label="Syllabus text"
          />
          <div className="paste-foot">
            <button className="btn btn-primary btn-lg" onClick={parseText} disabled={loading || !syllabus}>
              {loading ? (
                "Reading syllabus..."
              ) : (
                <>
                  Find deadlines <IconArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        {loading && (
          <div className="scan-overlay">
            <ScanLoader />
          </div>
        )}
      </div>

      <label className="switch reveal" style={{ "--i": 3 } as CSSProperties}>
        <input type="checkbox" checked={autoAdd} onChange={(e) => setAutoAdd(e.target.checked)} />
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb" />
        </span>
        <span className="switch-text">
          <b>Skip review and add everything automatically</b>
          <span>Deadlines go straight onto your calendar without the check step.</span>
        </span>
      </label>

      <label className="switch reveal" style={{ "--i": 3 } as CSSProperties}>
        <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb" />
        </span>
        <span className="switch-text">
          <b>Share with classmates</b>
          <span>
            Once you've reviewed them, your course deadlines become searchable for other students in the course.
            Only the deadlines are shared, never your name or email.
          </span>
        </span>
      </label>

      {error && (
        <div className="notice notice-error" role="alert">
          <IconAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      <ol className="how reveal" style={{ "--i": 4 } as CSSProperties}>
        <li>
          <span className="how-icon"><IconUpload size={16} /></span>
          <span><b>Upload</b>PDF or pasted text</span>
        </li>
        <li>
          <span className="how-icon"><IconCheck size={16} /></span>
          <span><b>Review</b>Fix anything the AI got wrong</span>
        </li>
        <li>
          <span className="how-icon"><IconCalendar size={16} /></span>
          <span><b>Done</b>Every deadline on one calendar</span>
        </li>
      </ol>

      {pending.length > 0 && (
        <ReviewPopup
          pending={pending}
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
