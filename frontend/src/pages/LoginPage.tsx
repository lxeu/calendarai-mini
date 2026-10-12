import { useEffect, useId, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabaseClient";
import Logo from "../components/Logo";
import RotatingWord from "../components/RotatingWord";
import {
  IconAlert, IconArrowRight, IconCheck, IconEye, IconEyeOff, IconGoogle, IconInfo, IconLock, IconMail, IconSparkles,
} from "../components/Icons";
import { COURSE_COLORS } from "../lib/courses";
import { addDays, formatShort, todayISO } from "../lib/dates";

type Message = { text: string; kind: "error" | "info" };
type Busy = "signin" | "signup" | "google" | null;

// Only UAlberta accounts can sign up. The real check is the Supabase signup hook
// (supabase/restrict_signup.sql); this one just gives a faster, friendlier message.
const SCHOOL_DOMAIN = "ualberta.ca";

// If Supabase rejected a Google signup, it sends us back with ?error_description=... (or #error_description=...)
function oauthError(): Message | null {
  const params = new URLSearchParams(window.location.search + "&" + window.location.hash.slice(1));
  const text = params.get("error_description");
  return text ? { text, kind: "error" } : null;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<Message | null>(oauthError);
  const [busy, setBusy] = useState<Busy>(null);
  const [showPassword, setShowPassword] = useState(false);
  const id = useId();

  // Clear the error out of the address bar so a refresh doesn't show it again
  useEffect(() => {
    if (oauthError()) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function signIn() {
    setMessage(null);
    setBusy("signin");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage({ text: error.message, kind: "error" });
    setBusy(null);
  }

  async function signUp() {
    setMessage(null);
    if (!email.trim().toLowerCase().endsWith(`@${SCHOOL_DOMAIN}`)) {
      setMessage({ text: `Please sign up with your @${SCHOOL_DOMAIN} email.`, kind: "error" });
      return;
    }
    setBusy("signup");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage({ text: error.message, kind: "error" });
    else if (!data.session) setMessage({ text: "Check your email to confirm your account, then sign in.", kind: "info" });
    setBusy(null);
  }

  async function signInWithGoogle() {
    setMessage(null);
    setBusy("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      // hd tells Google to only offer UAlberta accounts in its account picker
      options: { redirectTo: window.location.origin, queryParams: { hd: SCHOOL_DOMAIN } },
    });
    if (error) {
      setMessage({ text: error.message, kind: "error" });
      setBusy(null);
    }
    // on success the browser is already on its way to Google
  }

  return (
    <div className="login">
      <section className="login-hero">
        <div className="login-brand reveal">
          <Logo size={34} />
          <span className="brand-name">
            CalendarAI<span className="brand-mini">mini</span>
          </span>
        </div>
        <span className="eyebrow reveal" style={{ "--i": 1 } as CSSProperties}>
          <IconSparkles size={14} /> Syllabus in, semester out
        </span>
        <h1 className="hero-title reveal" style={{ "--i": 2 } as CSSProperties}>
          Your semester,
          <br />
          <span className="serif-accent">decoded.</span>
        </h1>
        <p className="hero-sub reveal" style={{ "--i": 3 } as CSSProperties}>
          Drop in a syllabus and never miss a <RotatingWord words={["midterm", "lab report", "quiz", "final", "problem set"]} /> again.
        </p>
        <ul className="hero-points reveal" style={{ "--i": 4 } as CSSProperties}>
          <li><IconCheck size={15} /> Reads PDFs or pasted text</li>
          <li><IconCheck size={15} /> You approve every date</li>
          <li><IconCheck size={15} /> Exports to any calendar app</li>
        </ul>
        <HeroVisual />
      </section>

      <section className="auth-card card glow reveal" style={{ "--i": 2 } as CSSProperties}>
        <div className="auth-head">
          <h2>Welcome</h2>
          <p>Sign in to see your deadlines.</p>
        </div>

        <button type="button" className="btn btn-google" onClick={signInWithGoogle} disabled={busy !== null}>
          {busy === "google" ? <span className="spinner spinner-dark" /> : <IconGoogle size={20} />}
          {busy === "google" ? "Opening Google…" : "Continue with Google"}
        </button>

        <div className="divider">
          <span>or use email</span>
        </div>

        <form
          className="auth-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            signIn();
          }}
        >
          <div className="field">
            <label htmlFor={`${id}-email`}>Email</label>
            <div className="input-wrap">
              <IconMail size={17} />
              <input
                id={`${id}-email`}
                className="input has-icon"
                type="email"
                placeholder="you@ualberta.ca"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor={`${id}-password`}>Password</label>
            <div className="input-wrap">
              <IconLock size={17} />
              <input
                id={`${id}-password`}
                className="input has-icon has-action"
                type={showPassword ? "text" : "password"}
                placeholder="6+ characters"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <IconEyeOff size={17} /> : <IconEye size={17} />}
              </button>
            </div>
          </div>

          <div className="auth-actions">
            <button type="submit" className="btn btn-primary" disabled={busy !== null}>
              {busy === "signin" ? <span className="spinner" /> : null}
              Sign in
              {busy !== "signin" && <IconArrowRight size={16} />}
            </button>
            <button type="button" className="btn btn-ghost" onClick={signUp} disabled={busy !== null}>
              {busy === "signup" ? <span className="spinner" /> : null}
              Create account
            </button>
          </div>
        </form>

        {message && (
          <p className={`notice notice-${message.kind}`} role="status">
            {message.kind === "error" ? <IconAlert size={18} /> : <IconInfo size={18} />}
            <span>{message.text}</span>
          </p>
        )}
      </section>
    </div>
  );
}

// Decorative mini calendar for this month, with a few floating deadline cards
function HeroVisual() {
  const today = todayISO();
  const [y, m, d] = today.split("-").map(Number);
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const monthName = new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long" });
  const marked: Record<number, string> = {};
  [3, 8, 11, 15, 19, 24].forEach((offset, i) => {
    const day = ((d + offset - 1) % daysInMonth) + 1;
    marked[day] = COURSE_COLORS[i % 5];
  });
  const chips = [
    { course: "CS 101", title: "Midterm", offset: 8, color: COURSE_COLORS[0] },
    { course: "BIO 210", title: "Lab report", offset: 3, color: COURSE_COLORS[4] },
    { course: "ECON 1", title: "Quiz 3", offset: 15, color: COURSE_COLORS[2] },
  ];

  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hv-scene">
        <div className="hv-cal">
          <div className="hv-cal-head">
            <b>{monthName}</b>
            <span>{y}</span>
          </div>
          <div className="hv-cal-grid">
            {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
              <span key={`w${i}`} className="hv-wd">{w}</span>
            ))}
            {Array.from({ length: firstWeekday }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              return (
                <span key={day} className={`hv-day${day === d ? " is-today" : ""}`}>
                  {day}
                  {marked[day] && <i style={{ "--c": marked[day] } as CSSProperties} />}
                </span>
              );
            })}
          </div>
        </div>
        {chips.map((c, i) => {
          const due = formatShort(addDays(today, c.offset));
          return (
            <div key={c.course} className={`hv-chip hv-chip-${i + 1}`} style={{ "--c": c.color } as CSSProperties}>
              <i />
              <span>
                <b>{c.course}</b> · {c.title}
              </span>
              <em>
                {due.month} {due.day}
              </em>
            </div>
          );
        })}
      </div>
    </div>
  );
}
