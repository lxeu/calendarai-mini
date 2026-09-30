import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function signIn() {
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
  }

  async function signUp() {
    setMessage("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else if (!data.session) setMessage("Check your email to confirm your account, then sign in.");
  }

  return (
    <div style={{ maxWidth: 320, margin: "80px auto" }}>
      <h1>CalendarAI Mini</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 8 }}
      />
      <input
        type="password"
        placeholder="Password (6+ characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 8 }}
      />
      <button onClick={signIn}>Sign in</button>{" "}
      <button onClick={signUp}>Create account</button>
      {message && <p>{message}</p>}
    </div>
  );
}