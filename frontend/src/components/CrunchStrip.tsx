import { useState, type CSSProperties } from "react";
import type { Deadline } from "../types";
import { addDays, formatShort } from "../lib/dates";

type Props = {
  deadlines: Deadline[];
  today: string;
  colorFor: (course: string) => string;
};

const DAYS = 14;

// Column chart of how many deadlines land on each of the next 14 days
export default function CrunchStrip({ deadlines, today, colorFor }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const days = Array.from({ length: DAYS }, (_, i) => {
    const iso = addDays(today, i);
    return { i, iso, f: formatShort(iso), items: deadlines.filter((d) => d.date === iso) };
  });
  const max = Math.max(0, ...days.map((d) => d.items.length));
  const peak = max > 0 ? days.findIndex((d) => d.items.length === max) : -1;
  const total = days.reduce((n, d) => n + d.items.length, 0);

  return (
    <div className="crunch">
      <div className="section-head">
        <h3 className="section-title">Next 14 days</h3>
        <span className="muted">
          {total > 0 ? `${total} due · busiest ${days[peak].f.label}` : "Nothing due"}
        </span>
      </div>

      <div className="crunch-plot" role="list" aria-label="Deadlines per day for the next 14 days">
        {days.map((d) => {
          const n = d.items.length;
          const pct = max ? (n / max) * 100 : 0;
          const edge = d.i < 3 ? " tip-left" : d.i > DAYS - 4 ? " tip-right" : "";
          return (
            <div
              key={d.iso}
              className={`crunch-col${hover === d.i ? " is-hover" : ""}`}
              role="listitem"
              tabIndex={0}
              aria-label={`${d.i === 0 ? "Today, " : ""}${d.f.label}: ${n} deadline${n === 1 ? "" : "s"}`}
              onMouseEnter={() => setHover(d.i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(d.i)}
              onBlur={() => setHover(null)}
            >
              <div className="crunch-track">
                {n > 0 && <span className="crunch-bar" style={{ height: `${pct}%` }} />}
              </div>
              <span className={`crunch-day${d.i === 0 ? " is-today" : ""}`}>{d.f.weekday.slice(0, 1)}</span>

              {hover === d.i && (
                <div className={`crunch-tip${edge}`} role="tooltip">
                  <strong>
                    {d.i === 0 ? `Today, ${d.f.label}` : d.f.label} · {n} due
                  </strong>
                  {d.items.slice(0, 4).map((item, k) => (
                    <span className="crunch-tip-row" key={k}>
                      <i className="dot" style={{ "--c": colorFor(item.course) } as CSSProperties} />
                      <span>
                        {item.course}: {item.title}
                      </span>
                    </span>
                  ))}
                  {n > 4 && <span className="muted">{n - 4} more</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
