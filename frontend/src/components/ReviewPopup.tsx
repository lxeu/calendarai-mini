import { useEffect, useId, useRef, useState } from "react";
import type { Deadline } from "../types";
import Modal from "./Modal";
import { IconCheck, IconChecks, IconSparkles, IconTrash } from "./Icons";
import { prefersReducedMotion } from "../lib/motion";
import { modKey } from "../lib/platform";

const CATEGORIES = ["assignment", "lab", "quiz", "midterm", "final", "other"];
const EXIT_MS = 280;

type Props = {
  pending: Deadline[];
  onUpdate: (field: keyof Deadline, value: string) => void;
  onConfirm: () => void;
  onDelete: () => void;
  onConfirmAll: () => void;
};

export default function ReviewPopup({ pending, onUpdate, onConfirm, onDelete, onConfirmAll }: Props) {
  const current = pending[0];
  const id = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [startCount] = useState(pending.length);
  const [leaving, setLeaving] = useState<"confirm" | "delete" | null>(null);

  const total = Math.max(startCount, pending.length);
  const reviewed = total - pending.length;

  // Let the card fly off screen before the next one slides in
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
      <div className="rv-stack" data-blocking-modal>
        {pending.length > 2 && <div className="rv-ghost g2" aria-hidden="true" />}
        {pending.length > 1 && <div className="rv-ghost g1" aria-hidden="true" />}

        <div key={reviewed} className={`rv-card${leaving ? ` leaving-${leaving}` : ""}`}>
          <div className="rv-top">
            <span className="eyebrow">
              <IconSparkles size={14} /> Review
            </span>
            <span className="rv-count">
              Deadline <b>{reviewed + 1}</b> of {total}
            </span>
          </div>
          <div className="rv-progress" aria-hidden="true">
            <span style={{ width: `${(reviewed / total) * 100}%` }} />
          </div>

          <h2 className="rv-title">Does this look right?</h2>

          <figure className="quote">
            <figcaption>From your syllabus</figcaption>
            <blockquote>{current.source}</blockquote>
          </figure>

          <fieldset className="rv-fields" disabled={leaving !== null}>
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

          <div className="rv-actions">
            <button className="btn btn-danger" onClick={() => leave("delete", onDelete)} disabled={leaving !== null}>
              <IconTrash size={16} /> Delete
            </button>
            <span className="rv-spacer" />
            <button className="btn btn-ghost" onClick={onConfirmAll} disabled={leaving !== null}>
              <IconChecks size={16} /> Confirm all {pending.length}
            </button>
            <button ref={confirmRef} className="btn btn-primary" onClick={() => leave("confirm", onConfirm)} disabled={leaving !== null}>
              <IconCheck size={16} /> Confirm
              <kbd className="kbd-inline">{modKey}↵</kbd>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
