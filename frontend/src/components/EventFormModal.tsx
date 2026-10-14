import { useId, useState, type FormEvent } from "react";
import type { Deadline } from "../types";
import Modal from "./Modal";
import { IconX } from "./Icons";
import { PERSONAL, isPersonal } from "../lib/courses";
import { todayISO } from "../lib/dates";

const SCHOOL_CATEGORIES = ["assignment", "lab", "quiz", "midterm", "final", "other"];
const PERSONAL_CATEGORIES = ["event", "work", "appointment", "social", "other"];

type Props = {
  courses: string[];
  // Leave out to add a new event; pass one to edit it
  initial?: Deadline;
  onSubmit: (item: Deadline) => void;
  onClose: () => void;
};

// Add or edit a single event by hand: a school deadline or something outside of school
export default function EventFormModal({ courses, initial, onSubmit, onClose }: Props) {
  const id = useId();
  const schoolCourses = courses.filter((c) => !isPersonal(c));
  const [personal, setPersonal] = useState(initial ? isPersonal(initial.course) : false);
  const [course, setCourse] = useState(initial && !isPersonal(initial.course) ? initial.course : (schoolCourses[0] ?? ""));
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [category, setCategory] = useState(initial?.category ?? "assignment");

  const categories = personal ? PERSONAL_CATEGORIES : SCHOOL_CATEGORIES;
  const ready = (personal || course.trim()) && title.trim() && date;

  function switchKind(toPersonal: boolean) {
    setPersonal(toPersonal);
    setCategory(toPersonal ? "event" : "assignment");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    onSubmit({
      ...initial,
      course: personal ? PERSONAL : course.trim(),
      title: title.trim(),
      date,
      category,
      // An empty source marks it as added by hand (there's no syllabus sentence to quote)
      source: initial?.source ?? "",
    });
    onClose();
  }

  return (
    <Modal label={initial ? "Edit event" : "Add event"} onClose={onClose}>
      <div className="modal-head">
        <h2 className="modal-title">{initial ? "Edit event" : "Add event"}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <IconX />
        </button>
      </div>

      <form onSubmit={submit}>
        <div className="fields">
          <div className="field field-wide">
            <div className="segmented" role="radiogroup" aria-label="Kind of event">
              {[false, true].map((p) => (
                <button
                  key={String(p)}
                  type="button"
                  role="radio"
                  aria-checked={personal === p}
                  className="segmented-option"
                  onClick={() => switchKind(p)}
                >
                  {p ? "Personal" : "School"}
                </button>
              ))}
            </div>
          </div>
          {!personal && (
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
                {schoolCourses.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          )}
          <div className={`field${personal ? " field-wide" : ""}`}>
            <label htmlFor={`${id}-date`}>Date</label>
            <input id={`${id}-date`} className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field field-wide">
            <label htmlFor={`${id}-title`}>Title</label>
            <input
              id={`${id}-title`}
              className="input"
              placeholder={personal ? "Dentist appointment" : "Assignment 3"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field field-wide">
            <span className="field-label" id={`${id}-type`}>Type</span>
            <div className="chips" role="radiogroup" aria-labelledby={`${id}-type`}>
              {categories.map((c) => (
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

        <div className="modal-actions">
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!ready}>
            {initial ? "Save changes" : "Add event"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
