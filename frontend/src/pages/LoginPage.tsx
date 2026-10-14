import { useEffect, useId, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import HeroDemo from "../components/HeroDemo";
import Logo from "../components/Logo";
import { IconAlert, IconCheck, IconEye, IconEyeOff, IconGoogle, IconInfo } from "../components/Icons";

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
      <section className="login-intro">
        <div className="brand">
          <Logo />
          <span className="brand-name">CalendarAI Mini</span>
        </div>
        <h1 className="page-title">Every deadline from your syllabi, on one calendar.</h1>
        <p className="muted">
          Upload a course syllabus and CalendarAI Mini finds the assignments, labs, quizzes and exams in it. You check
          each date before it's saved.
        </p>
        <HeroDemo />
        <ul className="facts">
          {[
            "Reads PDFs and pasted text",
            "Nothing is added until you confirm it",
            "Exports to Google, Apple and Outlook",
            "Find a study buddy in the same course",
          ].map((fact) => (
            <li key={fact}>
              <IconCheck size={14} /> {fact}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel auth" aria-labelledby={`${id}-heading`}>
        <div>
          <h2 className="section-title" id={`${id}-heading`}>
            Sign in
          </h2>
          <p className="muted">For University of Alberta students. Use your @{SCHOOL_DOMAIN} account.</p>
        </div>

        <button type="button" className="btn btn-block" onClick={signInWithGoogle} disabled={busy !== null}>
          {busy === "google" ? <span className="spinner" /> : <IconGoogle />}
          {busy === "google" ? "Opening Google…" : "Continue with Google"}
        </button>

        <div className="divider">
          <span>or</span>
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
            <input
              id={`${id}-email`}
              className="input"
              type="email"
              placeholder="you@ualberta.ca"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={`${id}-password`}>Password</label>
            <div className="input-wrap">
              <input
                id={`${id}-password`}
                className="input has-action"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
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
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          {message && (
            <p className={`notice notice-${message.kind}`} role="status">
              {message.kind === "error" ? <IconAlert /> : <IconInfo />}
              <span>{message.text}</span>
            </p>
          )}

          <div className="auth-actions">
            <button type="submit" className="btn btn-primary" disabled={busy !== null}>
              {busy === "signin" && <span className="spinner" />}
              Sign in
            </button>
            <button type="button" className="btn" onClick={signUp} disabled={busy !== null}>
              {busy === "signup" && <span className="spinner" />}
              Create account
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
