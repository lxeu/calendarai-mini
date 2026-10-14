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

// "Due soon": everything not done in the next few days, with one-tap "done"
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
      toast("You'll be notified about anything due today or tomorrow while this tab is open", "success");
      sendDueNotifications(deadlines);
    }
  }

  return (
    <section className="side-section" aria-label="Due soon">
      <div className="section-head">
        <h3 className="section-title">Due soon</h3>
        {notificationsSupported() && (
          <button
            className={`btn btn-sm btn-quiet${notify ? " is-on" : ""}`}
            onClick={toggleNotify}
            aria-pressed={notify}
            title={notify ? "Turn off browser notifications" : "Get a browser notification the day before"}
          >
            <IconBell size={14} /> {notify ? "Notifications on" : "Notify me"}
          </button>
        )}
      </div>

      {soon.length === 0 ? (
        <p className="muted">Nothing due in the next {REMIND_DAYS} days.</p>
      ) : (
        <ul className="rows">
          {soon.map(({ d, days }) => (
            <li key={d.id} className="row" style={{ "--c": colorFor(d.course) } as CSSProperties}>
              <button className="row-main" onClick={() => onOpen(d)}>
                <i className="dot" />
                <span className="row-text">
                  <span className="row-title">{d.title}</span>
                  <span className="row-meta">{d.course}</span>
                </span>
                <span className={`when${days <= 1 ? " when-hot" : ""}`}>{relativeLabel(days)}</span>
              </button>
              <button className="icon-btn icon-btn-done" onClick={() => onDone(d)} aria-label={`Mark ${d.title} done`} title="Mark done">
                <IconCheck />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
