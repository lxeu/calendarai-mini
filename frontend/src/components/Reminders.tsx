import { useState, type CSSProperties } from "react";
import type { Deadline } from "../types";
import { IconBell, IconCheck } from "./Icons";
import { REMIND_DAYS, dueSoon, notificationsOn, notificationsSupported, sendDueNotifications, setNotifications } from "../lib/reminders";
import { relativeLabel } from "../lib/dates";
import { toast } from "../lib/toast";

type Props = {
  deadlines: Deadline[];
  colorFor: (course: string) => string;
  onOpen: (d: Deadline) => void;
  onDone: (d: Deadline) => void;
};

// "Coming up" card: everything not done in the next few days, with one-tap "done"
export default function Reminders({ deadlines, colorFor, onOpen, onDone }: Props) {
  const [notify, setNotify] = useState(notificationsOn);
  const soon = dueSoon(deadlines);

  async function toggleNotify() {
    const on = await setNotifications(!notify);
    if (!notify && !on) {
      toast("Notifications are blocked. Allow them for this site in your browser settings.", "error");
      return;
    }
    setNotify(on);
    if (on) {
      toast("You'll get a notification for anything due today or tomorrow while CalendarAI is open", "success");
      sendDueNotifications(deadlines);
    }
  }

  return (
    <section className="card reminders reveal" style={{ "--i": 2 } as CSSProperties} aria-label="Reminders">
      <div className="card-head">
        <div>
          <h3 className="card-title">
            <IconBell size={16} /> Reminders
          </h3>
          <p className="card-sub">
            {soon.length
              ? `${soon.length} due in the next ${REMIND_DAYS} days`
              : `Nothing due in the next ${REMIND_DAYS} days. Nice.`}
          </p>
        </div>
        {notificationsSupported() && (
          <button className={`btn btn-sm ${notify ? "btn-primary" : "btn-ghost"}`} onClick={toggleNotify} aria-pressed={notify}>
            <IconBell size={15} /> {notify ? "Notifications on" : "Notify me"}
          </button>
        )}
      </div>

      {soon.length > 0 && (
        <ul className="rem-list">
          {soon.map(({ d, days }) => (
            <li
              key={d.id}
              className={`rem-item${days <= 1 ? " rem-hot" : ""}`}
              style={{ "--c": colorFor(d.course) } as CSSProperties}
            >
              <button className="rem-main" onClick={() => onOpen(d)}>
                <span className="rem-when">{relativeLabel(days)}</span>
                <span className="rem-title">{d.title}</span>
                <span className="rem-course">
                  <i />
                  {d.course}
                </span>
              </button>
              <button className="icon-btn rem-done" onClick={() => onDone(d)} aria-label={`Mark ${d.title} done`} title="Mark done">
                <IconCheck size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
