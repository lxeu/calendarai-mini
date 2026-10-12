import { useState, type CSSProperties } from "react";
import Modal from "./Modal";
import EventFormModal from "./EventFormModal";
import { IconCalendar, IconCheck, IconExternal, IconPencil, IconTrash, IconX } from "./Icons";
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
      <div className="dm-glow" style={{ "--c": color } as CSSProperties} aria-hidden="true" />
      <button className="icon-btn dm-close" onClick={onClose} aria-label="Close">
        <IconX size={18} />
      </button>

      <div className="dm-meta">
        <span className="course-chip" style={{ "--c": color } as CSSProperties}>
          <i />
          {deadline.course}
        </span>
        <span className="tag">{deadline.category}</span>
        {deadline.done && (
          <span className="tag tag-done">
            <IconCheck size={12} /> done
          </span>
        )}
      </div>

      <h2 className={`dm-title${deadline.done ? " is-done" : ""}`}>{deadline.title}</h2>
      <p className="dm-date">
        <IconCalendar size={16} />
        {formatLong(deadline.date)}
        {!Number.isNaN(days) && (
          <span className={`when ${days < 0 ? "when-past" : days <= 1 ? "when-hot" : ""}`}>{relativeLabel(days)}</span>
        )}
      </p>

      {deadline.source && (
        <figure className="quote">
          <figcaption>From your syllabus</figcaption>
          <blockquote>{deadline.source}</blockquote>
        </figure>
      )}

      {confirmingDelete ? (
        <div className="dm-actions dm-confirm">
          <span>Delete this {deadline.category}? It can't be undone.</span>
          <button className="btn btn-ghost" onClick={() => setConfirmingDelete(false)} autoFocus>
            Cancel
          </button>
          <button
            className="btn btn-danger-solid"
            onClick={() => {
              onDelete();
              onClose();
            }}
          >
            <IconTrash size={16} /> Delete
          </button>
        </div>
      ) : (
        <div className="dm-actions">
          <button className="btn btn-danger" onClick={() => setConfirmingDelete(true)} aria-label="Delete">
            <IconTrash size={16} />
          </button>
          <span className="rv-spacer" />
          <button className="btn btn-ghost" onClick={() => setEditing(true)}>
            <IconPencil size={16} /> Edit
          </button>
          <a className="btn btn-ghost" href={googleCalendarUrl(deadline)} target="_blank" rel="noreferrer">
            <IconExternal size={16} />
            Google Calendar
          </a>
          <button
            className="btn btn-primary"
            onClick={() => {
              onSave({ ...deadline, done: !deadline.done });
              onClose();
            }}
            autoFocus
          >
            <IconCheck size={16} /> {deadline.done ? "Mark not done" : "Mark done"}
          </button>
        </div>
      )}
    </Modal>
  );
}
