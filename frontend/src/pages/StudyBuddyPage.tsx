import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import type { Deadline, StudyMatch, StudyMessage } from "../types";
import Modal from "../components/Modal";
import { IconSend, IconUsers, IconX } from "../components/Icons";
import { PERSONAL, courseColor, listCourses, normalizeCourse } from "../lib/courses";
import { toast } from "../lib/toast";

type Props = {
  session: Session;
  deadlines: Deadline[];
};

const cssVars = (vars: Record<string, string | number>) => vars as CSSProperties;

// The other person in a match, from my point of view
function partner(m: StudyMatch, me: string) {
  return m.user_a === me
    ? { name: m.user_b_name, avatar: m.user_b_avatar }
    : { name: m.user_a_name, avatar: m.user_a_avatar };
}

export default function StudyBuddyPage({ session, deadlines }: Props) {
  const me = session.user.id;
  const [waiting, setWaiting] = useState<string[]>([]);
  const [matches, setMatches] = useState<StudyMatch[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [busyCourse, setBusyCourse] = useState<string | null>(null);
  const [extraCourse, setExtraCourse] = useState("");

  // Pull my waiting requests and active matches from the database
  function refresh() {
    return Promise.all([
      supabase.from("study_requests").select("course"),
      supabase.from("study_matches").select().is("ended_at", null).order("created_at"),
    ]).then(([req, mat]) => {
      if (req.error || mat.error) {
        console.error(req.error ?? mat.error);
        return;
      }
      setWaiting(req.data.map((r) => r.course));
      setMatches(mat.data);
    });
  }

  // Load once, then listen for someone matching with me (or unmatching) while I'm here
  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("study-matches")
      .on("postgres_changes", { event: "*", schema: "public", table: "study_matches" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const m = payload.new as StudyMatch;
          if (m.user_b === me) toast(`Matched with ${m.user_a_name} for ${m.course}`, "success");
        }
        refresh();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me]);

  // Courses from the calendar, plus any you're waiting or matched in
  const courses = [
    ...new Set([
      ...listCourses(deadlines).map(normalizeCourse),
      ...waiting,
      ...matches.map((m) => m.course),
    ]),
    // course names are uppercased here, so compare against the normalized "PERSONAL"
  ].filter((c) => c && c !== normalizeCourse(PERSONAL));
  const calendarCourses = listCourses(deadlines).map(normalizeCourse);
  const colorFor = (course: string) => courseColor(calendarCourses, course);
  const open = matches.find((m) => m.id === openId) ?? null;

  async function findBuddy(course: string) {
    setBusyCourse(course);
    const { data, error } = await supabase.rpc("find_study_buddy", { p_course: course });
    setBusyCourse(null);
    if (error) {
      toast("Couldn't search: " + error.message, "error");
      return;
    }
    const match = data as StudyMatch | null;
    // rpc returns a row of nulls rather than null when the function returns null
    if (match?.id) {
      toast(`Matched with ${partner(match, me).name} for ${match.course}`, "success");
      setOpenId(match.id);
    } else {
      toast(`Waiting for a match in ${course}. You'll be paired when someone else joins.`, "info");
    }
    refresh();
  }

  async function cancel(course: string) {
    const { error } = await supabase.from("study_requests").delete().eq("course", course);
    if (error) toast("Couldn't cancel: " + error.message, "error");
    refresh();
  }

  async function unmatch(match: StudyMatch) {
    const { error } = await supabase.rpc("end_study_match", { p_match_id: match.id });
    if (error) {
      toast("Couldn't unmatch: " + error.message, "error");
      return;
    }
    setOpenId(null);
    toast(`Unmatched. You won't be paired with ${partner(match, me).name} for ${match.course} again.`, "info");
    refresh();
  }

  function addCourse(e: FormEvent) {
    e.preventDefault();
    const course = normalizeCourse(extraCourse);
    if (!course) return;
    setExtraCourse("");
    findBuddy(course);
  }

  return (
    <div className="buddy-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Study buddy</h1>
          <p className="muted page-sub">
            Get paired with another student in one of your courses who's also looking, then message them here.
          </p>
        </div>
      </header>

      <div className="buddy-grid">
        <section className="panel buddy-courses" aria-label="Your courses">
          <div className="section-head">
            <h2 className="section-title">Your courses</h2>
            <span className="muted">One buddy per course</span>
          </div>

          {courses.length === 0 && <p className="muted">No courses yet. Add a syllabus, or enter a course below.</p>}

          <ul className="rows">
            {courses.map((course) => {
              const match = matches.find((m) => m.course === course);
              const isWaiting = waiting.includes(course);
              return (
                <li key={course} className={`row buddy-row${match && openId === match.id ? " is-open" : ""}`} style={cssVars({ "--c": colorFor(course) })}>
                  <span className="row-text">
                    <span className="row-title">
                      <i className="dot" /> {course}
                    </span>
                  </span>
                  {match ? (
                    <button className="btn btn-sm" onClick={() => setOpenId(match.id)} aria-pressed={openId === match.id}>
                      <Avatar name={partner(match, me).name} url={partner(match, me).avatar} size={16} />
                      {partner(match, me).name.split(" ")[0]}
                    </button>
                  ) : isWaiting ? (
                    <>
                      <span className="muted buddy-waiting">
                        <span className="spinner" /> Waiting for a match
                      </span>
                      <button className="icon-btn" onClick={() => cancel(course)} aria-label={`Stop searching in ${course}`} title="Stop searching">
                        <IconX />
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-sm" onClick={() => findBuddy(course)} disabled={busyCourse !== null}>
                      {busyCourse === course && <span className="spinner" />}
                      Find a buddy
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <form className="inline-form" onSubmit={addCourse}>
            <input
              className="input"
              placeholder="Course code, e.g. MATH 125"
              value={extraCourse}
              onChange={(e) => setExtraCourse(e.target.value)}
              aria-label="Course to find a buddy in"
            />
            <button type="submit" className="btn" disabled={!extraCourse.trim() || busyCourse !== null}>
              Find a buddy
            </button>
          </form>
        </section>

        <section className="panel chat-panel" aria-label="Chat">
          {open ? (
            <Chat key={open.id} match={open} me={me} onUnmatch={() => unmatch(open)} />
          ) : (
            <div className="chat-empty">
              <span className="icon-tile">
                <IconUsers />
              </span>
              <h2 className="section-title">{matches.length ? "Choose a buddy" : "No matches yet"}</h2>
              <p className="muted">
                {matches.length
                  ? "Pick someone from your courses to open your conversation."
                  : "Choose Find a buddy on a course. If no one is waiting, you'll be matched with the next person who joins."}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Chat({ match, me, onUnmatch }: { match: StudyMatch; me: string; onUnmatch: () => void }) {
  const [messages, setMessages] = useState<StudyMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [confirming, setConfirming] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const other = partner(match, me);

  // Add messages we don't have yet (our own send and the realtime echo both arrive)
  function merge(incoming: StudyMessage[]) {
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      return [...prev, ...incoming.filter((m) => !seen.has(m.id))];
    });
  }

  useEffect(() => {
    supabase
      .from("study_messages")
      .select()
      .eq("match_id", match.id)
      .order("created_at")
      .then(({ data, error }) => {
        if (error) console.error(error);
        else merge(data);
      });
    const channel = supabase
      .channel(`study-chat-${match.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "study_messages", filter: `match_id=eq.${match.id}` },
        (payload) => merge([payload.new as StudyMessage]),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id]);

  // Keep the newest message in view
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    const { data, error } = await supabase.from("study_messages").insert({ match_id: match.id, body }).select().single();
    if (error) {
      toast("Couldn't send: " + error.message, "error");
      setDraft(body);
      return;
    }
    merge([data]);
  }

  return (
    <div className="chat">
      <div className="chat-head">
        <Avatar name={other.name} url={other.avatar} size={24} />
        <div className="row-text">
          <span className="row-title">{other.name}</span>
          <span className="row-meta">{match.course}</span>
        </div>
        <span className="spacer" />
        <button className="btn btn-sm btn-quiet btn-danger-text" onClick={() => setConfirming(true)}>
          Unmatch
        </button>
      </div>

      <div className="chat-list" ref={listRef} aria-live="polite">
        {messages.length === 0 && (
          <p className="chat-hint muted">No messages yet. Say hi and suggest a time and place to study.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`bubble${m.sender === me ? " mine" : ""}`}>
            {m.body}
            <time>{new Date(m.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</time>
          </div>
        ))}
      </div>

      <form className="chat-input" onSubmit={send}>
        <input
          className="input"
          placeholder={`Message ${other.name.split(" ")[0]}`}
          value={draft}
          maxLength={2000}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Message"
          autoFocus
        />
        <button type="submit" className="btn btn-primary" disabled={!draft.trim()} aria-label="Send">
          <IconSend />
        </button>
      </form>

      {confirming && (
        <Modal label="Unmatch" onClose={() => setConfirming(false)} className="confirm-modal">
          <h2 className="modal-title">Unmatch with {other.name}?</h2>
          <p className="muted">The chat closes for both of you, and you won't be paired again in {match.course}.</p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setConfirming(false)} autoFocus>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                setConfirming(false);
                onUnmatch();
              }}
            >
              Unmatch
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Avatar({ name, url, size }: { name: string; url: string | null; size: number }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  return url && !failed ? (
    <img className="avatar" style={style} src={url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
  ) : (
    <span className="avatar avatar-fallback" style={style} aria-hidden="true">
      {(name[0] ?? "?").toUpperCase()}
    </span>
  );
}
