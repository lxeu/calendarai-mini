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
      <div className="card-head">
        <div>
          <h3 className="card-title">Next 14 days</h3>
          <p className="card-sub">
            {total > 0
              ? `${total} deadline${total === 1 ? "" : "s"} · busiest day ${days[peak].f.label}`
              : "Nothing due in the next two weeks."}
          </p>
        </div>
      </div>

      <div className="crunch-plot" role="list" aria-label="Deadlines per day for the next 14 days">
        {days.map((d) => {
          const n = d.items.length;
          const pct = max ? (n / max) * 100 : 0;
          const edge = d.i < 2 ? " tip-left" : d.i > DAYS - 3 ? " tip-right" : "";
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
                {n > 0 && (
                  <span className="crunch-bar" style={{ height: `${pct}%`, animationDelay: `${d.i * 40}ms` }} />
                )}
                {d.i === peak && (
                  <span className="crunch-val" style={{ bottom: `${pct}%` }}>
                    {n}
                  </span>
                )}
              </div>
              <span className={`crunch-day${d.i === 0 ? " is-today" : ""}`}>
                <span>{d.f.weekday.slice(0, 2)}</span>
                <b>{d.f.day}</b>
              </span>

              {hover === d.i && (
                <div className={`crunch-tip${edge}`} role="tooltip">
                  <strong>
                    {n} deadline{n === 1 ? "" : "s"}
                  </strong>
                  <span className="crunch-tip-date">{d.i === 0 ? `Today · ${d.f.label}` : d.f.label}</span>
                  {d.items.slice(0, 4).map((item, k) => (
                    <span className="crunch-tip-row" key={k}>
                      <i style={{ "--c": colorFor(item.course) } as CSSProperties} />
                      <span>
                        {item.course}: {item.title}
                      </span>
                    </span>
                  ))}
                  {n > 4 && <span className="crunch-tip-more">+{n - 4} more</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
