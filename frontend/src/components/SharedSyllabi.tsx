import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { SharedSyllabus } from "../types";
import { IconPlus, IconSearch, IconTrash } from "./Icons";
import { addDays, daysBetween, relativeLabel, todayISO } from "../lib/dates";
import { toast } from "../lib/toast";

type Props = {
  userId: string;
  disabled: boolean;
  onUse: (syllabus: SharedSyllabus) => void;
};

// Older than this is probably last term's syllabus
const FRESH_DAYS = 150;

// Search syllabi classmates already parsed and add one without uploading anything
export default function SharedSyllabi({ userId, disabled, onUse }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SharedSyllabus[] | null>(null);
  const [reload, setReload] = useState(0);

  // Search as you type (after a short pause), most-used first
  useEffect(() => {
    const timer = setTimeout(() => {
      // Values are quoted below (so "Dr. Smith" works); drop the characters that could break out of the quotes
      const q = query.trim().replace(/[%_\\,()"*]/g, "");
      let request = supabase
        .from("shared_syllabi")
        .select("id, course, deadlines, instructor, uploaded_by, use_count, updated_at")
        .gte("updated_at", addDays(todayISO(), -FRESH_DAYS))
        .order("use_count", { ascending: false })
        .limit(6);
      // Match the course code or the instructor's name
      if (q) request = request.or(`course.ilike."*${q}*",instructor.ilike."*${q}*"`);
      request.then(({ data, error }) => {
        // Table missing (SQL not run yet) or offline: just hide the section
        if (error) console.error(error);
        setResults(error ? [] : data);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [query, reload]);

  async function remove(s: SharedSyllabus) {
    const { error } = await supabase.from("shared_syllabi").delete().eq("id", s.id);
    if (error) toast("Couldn't remove: " + error.message, "error");
    else toast(`Stopped sharing ${s.course}`, "info");
    setReload((n) => n + 1);
  }

  // Nothing shared at all yet: don't show an empty box on first visit
  if (results === null || (results.length === 0 && !query)) return null;

  return (
    <section className="panel shared" aria-label="Shared by classmates">
      <div className="section-head">
        <div>
          <h2 className="section-title">Shared by classmates</h2>
          <p className="muted">If someone already added your course, use their deadlines and review them.</p>
        </div>
      </div>

      <div className="input-wrap">
        <IconSearch />
        <input
          className="input has-icon"
          placeholder="Course or instructor, e.g. CMPUT 174"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search shared syllabi"
        />
      </div>

      {results.length === 0 ? (
        <p className="muted">No one has shared “{query.trim()}” yet. Upload it below to be the first.</p>
      ) : (
        <ul className="rows">
          {results.map((s) => {
            const mine = s.uploaded_by === userId;
            const updated = daysBetween(todayISO(), s.updated_at.slice(0, 10));
            return (
              <li key={s.id} className="row shared-row">
                <span className="row-text">
                  <span className="row-title">
                    {s.course}
                    {s.instructor && <span className="muted"> · {s.instructor}</span>}
                  </span>
                  <span className="row-meta">
                    {s.deadlines.length} deadlines · used {s.use_count} times · updated {relativeLabel(updated).toLowerCase()}
                    {mine && " · shared by you"}
                  </span>
                </span>
                {mine && (
                  <button className="icon-btn" onClick={() => remove(s)} aria-label={`Stop sharing ${s.course}`} title="Stop sharing">
                    <IconTrash />
                  </button>
                )}
                <button className="btn btn-sm" onClick={() => onUse(s)} disabled={disabled}>
                  <IconPlus size={14} /> Use
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
