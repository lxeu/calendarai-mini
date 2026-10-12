import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabaseClient";
import type { SharedSyllabus } from "../types";
import { IconPlus, IconSearch, IconTrash, IconUsers } from "./Icons";
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
    <section className="card shared reveal" style={{ "--i": 1 } as CSSProperties}>
      <div className="card-head">
        <div>
          <h3 className="card-title">
            <IconUsers size={16} /> Shared by classmates
          </h3>
          <p className="card-sub">Someone may have already done the work. Add their deadlines and review them.</p>
        </div>
      </div>

      <div className="input-wrap shared-search">
        <IconSearch size={17} />
        <input
          className="input has-icon"
          placeholder="Search a course or instructor, e.g. CMPUT 174"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search shared syllabi"
        />
      </div>

      {results.length === 0 ? (
        <p className="card-sub">Nobody has shared "{query.trim()}" yet. Upload it below and you'll be the first.</p>
      ) : (
        <ul className="shared-list">
          {results.map((s) => {
            const mine = s.uploaded_by === userId;
            const updated = daysBetween(todayISO(), s.updated_at.slice(0, 10));
            return (
              <li key={s.id} className="shared-row">
                <span className="course-chip">
                  <i />
                  {s.course}
                </span>
                <span className="shared-meta">
                  {s.instructor && <b className="shared-instructor">{s.instructor} · </b>}
                  {s.deadlines.length} deadlines · used by {s.use_count} · updated {relativeLabel(updated).toLowerCase()}
                  {mine && <b> · shared by you</b>}
                </span>
                <span className="rv-spacer" />
                {mine && (
                  <button className="icon-btn" onClick={() => remove(s)} aria-label={`Stop sharing ${s.course}`} title="Stop sharing">
                    <IconTrash size={16} />
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => onUse(s)} disabled={disabled}>
                  <IconPlus size={15} /> Add
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
