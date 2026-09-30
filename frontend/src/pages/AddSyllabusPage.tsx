import { supabase } from "../lib/supabaseClient";
import { useState } from "react";
import { useNavigate } from "react-router";
import { API, type Deadline, type ParseResponse } from "../types";
import ReviewPopup from "../components/ReviewPopup";

type Props = {
  onAdd: (items: Deadline[]) => void;
};

export default function AddSyllabusPage({ onAdd }: Props) {
  const [syllabus, setSyllabus] = useState("");
  const [pending, setPending] = useState<Deadline[]>([]);
  const [autoAdd, setAutoAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
      if (autoAdd) {
        onAdd(data.deadlines);
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

  // When the review queue runs out, go back to the calendar
  function finishIfLast() {
    if (pending.length === 1) navigate("/");
  }

  return (
    <div>
      <h2>Add a syllabus</h2>

      <p><strong>Upload a PDF:</strong></p>
      <input
        type="file"
        accept=".pdf"
        disabled={loading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) parsePdf(file);
          e.target.value = "";
        }}
      />

      <p><strong>Or paste the text:</strong></p>
      <textarea
        value={syllabus}
        onChange={(e) => setSyllabus(e.target.value)}
        placeholder="Paste syllabus text here"
        rows={8}
        cols={60}
      />
      <br />
      <label>
        <input type="checkbox" checked={autoAdd} onChange={(e) => setAutoAdd(e.target.checked)} />
        Skip review and add everything automatically
      </label>
      <br />
      <button onClick={parseText} disabled={loading || !syllabus}>
        {loading ? "Reading syllabus..." : "Find deadlines"}
      </button>
      {error && <p>{error}</p>}

      {pending.length > 0 && (
        <ReviewPopup
          pending={pending}
          onUpdate={(field, value) =>
            setPending((prev) => [{ ...prev[0], [field]: value }, ...prev.slice(1)])
          }
          onConfirm={() => {
            onAdd([pending[0]]);
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
            navigate("/");
          }}
        />
      )}
    </div>
  );
}