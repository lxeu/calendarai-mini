import type { Deadline } from "../types";

const CATEGORIES = ["assignment", "lab", "quiz", "midterm", "final", "other"];

type Props = {
  pending: Deadline[];
  onUpdate: (field: keyof Deadline, value: string) => void;
  onConfirm: () => void;
  onDelete: () => void;
  onConfirmAll: () => void;
};

export default function ReviewPopup({ pending, onUpdate, onConfirm, onDelete, onConfirmAll }: Props) {
  const current = pending[0];

  return (
    <div style={overlay}>
      <div style={popup}>
        <p style={{ margin: 0, color: "#6b7280" }}>Deadline 1 of {pending.length}</p>
        <h2>Does this look right?</h2>

        <p style={{ marginBottom: 4 }}>From your syllabus:</p>
        <blockquote style={quote}>"{current.source}"</blockquote>

        <label>Course <input value={current.course} onChange={(e) => onUpdate("course", e.target.value)} /></label>
        <br />
        <label>Title <input value={current.title} onChange={(e) => onUpdate("title", e.target.value)} /></label>
        <br />
        <label>Date <input type="date" value={current.date} onChange={(e) => onUpdate("date", e.target.value)} /></label>
        <br />
        <label>
          Type{" "}
          <select value={current.category} onChange={(e) => onUpdate("category", e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button onClick={onConfirm}>Confirm</button>
          <button onClick={onDelete}>Delete</button>
          <button onClick={onConfirmAll}>Confirm all {pending.length}</button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};
const popup: React.CSSProperties = {
  background: "white",
  color: "black",
  padding: 24,
  borderRadius: 12,
  width: 440,
  maxWidth: "90vw",
};
const quote: React.CSSProperties = {
  margin: "0 0 16px 0",
  padding: "8px 12px",
  borderLeft: "4px solid #7c3aed",
  background: "#f3f4f6",
  fontStyle: "italic",
};