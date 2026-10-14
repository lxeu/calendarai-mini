import { useEffect, useId, useRef, useState } from "react";
import type { Deadline } from "../types";
import Modal from "./Modal";
import { IconChecks, IconTrash } from "./Icons";
import { prefersReducedMotion } from "../lib/motion";
import { modKey } from "../lib/platform";

const CATEGORIES = ["assignment", "lab", "quiz", "midterm", "final", "other"];
const EXIT_MS = 160;

type Props = {
  pending: Deadline[];
  // Shown (and editable) only when these deadlines will be shared with classmates
  instructor?: string;
  onInstructorChange?: (value: string) => void;
  onUpdate: (field: keyof Deadline, value: string) => void;
  onConfirm: () => void;
  onDelete: () => void;
  onConfirmAll: () => void;
};

export default function ReviewPopup({ pending, instructor, onInstructorChange, onUpdate, onConfirm, onDelete, onConfirmAll }: Props) {
  const current = pending[0];
  const id = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [startCount] = useState(pending.length);
  const [leaving, setLeaving] = useState<"confirm" | "delete" | null>(null);

  const total = Math.max(startCount, pending.length);
  const reviewed = total - pending.length;

  // Let the card fade out before the next one appears
  function leave(kind: "confirm" | "delete", action: () => void) {
    if (leaving) return;
    if (prefersReducedMotion()) return action();
    setLeaving(kind);
    setTimeout(() => {
      action();
      setLeaving(null);
    }, EXIT_MS);
  }

  // Cmd/Ctrl + Enter confirms the current deadline
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        confirmRef.current?.click();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Modal label="Review deadlines" className="review" overlayClassName="overlay-review">
      <div data-blocking-modal className={`rv-card${leaving ? ` leaving-${leaving}` : ""}`} key={reviewed}>
        <div className="modal-head">
          <h2 className="modal-title">Review deadline</h2>
          <span className="muted tabular">
            {reviewed + 1} of {total}
          </span>
        </div>
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${(reviewed / total) * 100}%` }} />
        </div>

        {instructor !== undefined && (
          <div className="field">
            <label htmlFor={`${id}-instructor`}>Instructors (shown to classmates)</label>
            <input
              id={`${id}-instructor`}
              className="input"
              placeholder="e.g. Dr. Beth Powell, Dr. Valerie Budd"
              value={instructor}
              onChange={(e) => onInstructorChange?.(e.target.value)}
            />
          </div>
        )}

        <figure className="quote">
          <figcaption>From the syllabus</figcaption>
          <blockquote>{current.source}</blockquote>
        </figure>

        <fieldset className="fields" disabled={leaving !== null}>
          <div className="field">
            <label htmlFor={`${id}-course`}>Course</label>
            <input id={`${id}-course`} className="input" value={current.course} onChange={(e) => onUpdate("course", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor={`${id}-date`}>Date</label>
            <input id={`${id}-date`} className="input" type="date" value={current.date} onChange={(e) => onUpdate("date", e.target.value)} />
          </div>
          <div className="field field-wide">
            <label htmlFor={`${id}-title`}>Title</label>
            <input id={`${id}-title`} className="input" value={current.title} onChange={(e) => onUpdate("title", e.target.value)} />
          </div>
          <div className="field field-wide">
            <span className="field-label" id={`${id}-type`}>Type</span>
            <div className="chips" role="radiogroup" aria-labelledby={`${id}-type`}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={current.category === c}
                  className={`chip${current.category === c ? " on" : ""}`}
                  onClick={() => onUpdate("category", c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        <div className="modal-actions">
          <button className="btn btn-quiet btn-danger-text" onClick={() => leave("delete", onDelete)} disabled={leaving !== null}>
            <IconTrash /> Discard
          </button>
          <span className="spacer" />
          <button className="btn" onClick={onConfirmAll} disabled={leaving !== null}>
            <IconChecks /> Add all {pending.length}
          </button>
          <button ref={confirmRef} className="btn btn-primary" onClick={() => leave("confirm", onConfirm)} disabled={leaving !== null}>
            Add
            <kbd className="kbd-inline">{modKey}↵</kbd>
          </button>
        </div>
      </div>
    </Modal>
  );
}
