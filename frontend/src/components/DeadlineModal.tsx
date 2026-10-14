import { useState, type CSSProperties } from "react";
import Modal from "./Modal";
import EventFormModal from "./EventFormModal";
import { IconCheck, IconExternal, IconPencil, IconTrash, IconX } from "./Icons";
import type { Deadline } from "../types";
import { daysBetween, formatLong, relativeLabel, todayISO } from "../lib/dates";
import { googleCalendarUrl } from "../lib/ics";

type Props = {
  deadline: Deadline;
  color: string;
  courses: string[];
  onSave: (changes: Deadline) => void;
  onDelete: () => void;
  onClose: () => void;
};

export default function DeadlineModal({ deadline, color, courses, onSave, onDelete, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const days = daysBetween(todayISO(), deadline.date);

  if (editing) {
    return <EventFormModal courses={courses} initial={deadline} onSubmit={onSave} onClose={onClose} />;
  }

  return (
    <Modal label={`${deadline.course}: ${deadline.title}`} onClose={onClose} className="deadline-modal">
      <div className="modal-head">
        <p className="row-meta" style={{ "--c": color } as CSSProperties}>
          <i className="dot" /> {deadline.course} · {deadline.category}
          {deadline.done && (
            <span className="tag">
              <IconCheck size={12} /> Done
            </span>
          )}
        </p>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <IconX />
        </button>
      </div>

      <h2 className={`modal-title${deadline.done ? " is-done" : ""}`}>{deadline.title}</h2>
      <p className="dm-date">
        {formatLong(deadline.date)}
        {!Number.isNaN(days) && (
          <span className={`when${days >= 0 && days <= 1 ? " when-hot" : ""}`}>{relativeLabel(days)}</span>
        )}
      </p>

      {deadline.source && (
        <figure className="quote">
          <figcaption>From the syllabus</figcaption>
          <blockquote>{deadline.source}</blockquote>
        </figure>
      )}

      {confirmingDelete ? (
        <div className="modal-actions dm-confirm">
          <span className="muted">Delete this {deadline.category}? It can't be undone.</span>
          <span className="spacer" />
          <button className="btn" onClick={() => setConfirmingDelete(false)} autoFocus>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              onDelete();
              onClose();
            }}
          >
            Delete
          </button>
        </div>
      ) : (
        <div className="modal-actions">
          <button className="icon-btn icon-btn-danger" onClick={() => setConfirmingDelete(true)} aria-label="Delete" title="Delete">
            <IconTrash />
          </button>
          <span className="spacer" />
          <button className="btn" onClick={() => setEditing(true)}>
            <IconPencil /> Edit
          </button>
          <a className="btn" href={googleCalendarUrl(deadline)} target="_blank" rel="noreferrer">
            <IconExternal /> Google Calendar
          </a>
          <button
            className="btn btn-primary"
            onClick={() => {
              onSave({ ...deadline, done: !deadline.done });
              onClose();
            }}
            autoFocus
          >
            <IconCheck /> {deadline.done ? "Mark not done" : "Mark done"}
          </button>
        </div>
      )}
    </Modal>
  );
}
