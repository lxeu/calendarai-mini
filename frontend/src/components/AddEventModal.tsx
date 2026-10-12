import { useId, useState, type FormEvent } from "react";
import type { Deadline } from "../types";
import Modal from "./Modal";
import { IconPlus, IconX } from "./Icons";
import { todayISO } from "../lib/dates";

const CATEGORIES = ["assignment", "lab", "quiz", "midterm", "final", "other"];

type Props = {
  courses: string[];
  onAdd: (items: Deadline[]) => void;
  onClose: () => void;
};

// Add a single deadline by hand, no syllabus needed
export default function AddEventModal({ courses, onAdd, onClose }: Props) {
  const id = useId();
  const [course, setCourse] = useState(courses[0] ?? "");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState("assignment");

  const ready = course.trim() && title.trim() && date;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    // An empty source marks it as added by hand (there's no syllabus sentence to quote)
    onAdd([{ course: course.trim(), title: title.trim(), date, category, source: "" }]);
    onClose();
  }

  return (
    <Modal label="Add event" onClose={onClose}>
      <button className="icon-btn dm-close" onClick={onClose} aria-label="Close">
        <IconX size={18} />
      </button>
      <h2 className="rv-title">Add an event</h2>

      <form onSubmit={submit}>
        <div className="rv-fields">
          <div className="field">
            <label htmlFor={`${id}-course`}>Course</label>
            <input
              id={`${id}-course`}
              className="input"
              list={`${id}-courses`}
              placeholder="CMPUT 174"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
            <datalist id={`${id}-courses`}>
              {courses.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label htmlFor={`${id}-date`}>Date</label>
            <input id={`${id}-date`} className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field field-wide">
            <label htmlFor={`${id}-title`}>Title</label>
            <input
              id={`${id}-title`}
              className="input"
              placeholder="Assignment 3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field field-wide">
            <span className="field-label" id={`${id}-type`}>Type</span>
            <div className="chips" role="radiogroup" aria-labelledby={`${id}-type`}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={category === c}
                  className={`chip${category === c ? " on" : ""}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rv-actions">
          <span className="rv-spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!ready}>
            <IconPlus size={16} /> Add event
          </button>
        </div>
      </form>
    </Modal>
  );
}
