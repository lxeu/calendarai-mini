import type { CSSProperties } from "react";
import Modal from "./Modal";
import { IconCalendar, IconExternal, IconX } from "./Icons";
import type { Deadline } from "../types";
import { daysBetween, formatLong, relativeLabel, todayISO } from "../lib/dates";
import { googleCalendarUrl } from "../lib/ics";

type Props = {
  deadline: Deadline;
  color: string;
  onClose: () => void;
};

export default function DeadlineModal({ deadline, color, onClose }: Props) {
  const days = daysBetween(todayISO(), deadline.date);

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
      </div>

      <h2 className="dm-title">{deadline.title}</h2>
      <p className="dm-date">
        <IconCalendar size={16} />
        {formatLong(deadline.date)}
        {!Number.isNaN(days) && (
          <span className={`when ${days < 0 ? "when-past" : days <= 1 ? "when-hot" : ""}`}>{relativeLabel(days)}</span>
        )}
      </p>

      <figure className="quote">
        <figcaption>From your syllabus</figcaption>
        <blockquote>{deadline.source}</blockquote>
      </figure>

      <div className="dm-actions">
        <a className="btn btn-ghost" href={googleCalendarUrl(deadline)} target="_blank" rel="noreferrer">
          <IconExternal size={16} />
          Add to Google Calendar
        </a>
        <button className="btn btn-primary" onClick={onClose} autoFocus>
          Done
        </button>
      </div>
    </Modal>
  );
}
