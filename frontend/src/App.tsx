import { useState } from "react";

// Describes what the backend's /ask sends back
type AskResponse = {
  reply: string;
};

function App() {
  const [text, setText] = useState("");
  const [reply, setReply] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendToBackend() {
    setLoading(true);
    const res = await fetch("http://127.0.0.1:8000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }),
    });
    const data: AskResponse = await res.json();
    setReply(data);
    setLoading(false);
  }

  return (
    <div>
      <h1>CalendarAI Mini</h1>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask Gemini something"
      />
      <button onClick={sendToBackend} disabled={loading}>
        {loading ? "Thinking..." : "Send"}
      </button>
      {reply && <p>Gemini says: {reply.reply}</p>}
    </div>
  );
}

export default App;