import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router";
import Modal from "./Modal";
import { IconCalendar, IconCornerDownLeft, IconDownload, IconLogout, IconSearch, IconSparkles } from "./Icons";
import type { Deadline } from "../types";
import { courseColor, listCourses } from "../lib/courses";
import { daysBetween, formatShort, relativeLabel, todayISO } from "../lib/dates";

type Props = {
  deadlines: Deadline[];
  onClose: () => void;
  onOpenDeadline: (d: Deadline) => void;
  onExport: () => void;
  onSignOut: () => void;
};

type Item = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  run: () => void;
};

export default function CommandPalette({ deadlines, onClose, onOpenDeadline, onExport, onSignOut }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const courses = listCourses(deadlines);
  const today = todayISO();
  const q = query.trim().toLowerCase();
  const has = (s: string | undefined) => !!s && s.toLowerCase().includes(q);

  const commands: Item[] = [
    { id: "go-cal", group: "Go to", label: "Calendar", hint: "All your deadlines", icon: <IconCalendar />, run: () => navigate("/") },
    { id: "go-add", group: "Go to", label: "Add syllabus", hint: "Upload a PDF or paste text", icon: <IconSparkles />, run: () => navigate("/add") },
    ...(deadlines.length > 0
      ? [{ id: "export", group: "Actions", label: "Export to calendar app (.ics)", hint: `${deadlines.length} deadlines`, icon: <IconDownload />, run: onExport }]
      : []),
    { id: "sign-out", group: "Actions", label: "Sign out", icon: <IconLogout />, run: onSignOut },
  ].filter((c) => !q || has(c.label) || has(c.hint));

  const matches: Item[] = deadlines
    .filter((d) => !q || has(d.title) || has(d.course) || has(d.category))
    // upcoming soonest-first, then past most-recent-first
    .sort((a, b) => {
      const ua = a.date >= today;
      const ub = b.date >= today;
      if (ua !== ub) return ua ? -1 : 1;
      return ua ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    })
    .slice(0, 8)
    .map((d, i) => ({
      id: `d${d.id ?? `-${i}`}`,
      group: q ? "Deadlines" : "Coming up",
      label: d.title,
      hint: `${d.course} · ${formatShort(d.date).label} · ${relativeLabel(daysBetween(today, d.date))}`,
      icon: <span className="pal-dot" style={{ "--c": courseColor(courses, d.course) } as CSSProperties} />,
      run: () => onOpenDeadline(d),
    }));

  const items = [...commands, ...matches];
  const current = items.length ? Math.min(active, items.length - 1) : -1;

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [current]);

  function choose(item: Item) {
    onClose();
    item.run();
  }

  return (
    <Modal label="Search and commands" onClose={onClose} className="palette" overlayClassName="overlay-top">
      <div className="pal-search">
        <IconSearch size={18} />
        <input
          autoFocus
          value={query}
          placeholder="Search deadlines, courses, or jump somewhere…"
          aria-label="Search"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (!items.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((current + 1) % items.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((current - 1 + items.length) % items.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(items[current]);
            }
          }}
        />
        <kbd>esc</kbd>
      </div>

      <div className="pal-list" ref={listRef}>
        {items.length === 0 && <p className="pal-empty">Nothing matches “{query}”.</p>}
        {items.map((item, i) => (
          <div key={item.id}>
            {(i === 0 || items[i - 1].group !== item.group) && <p className="pal-group">{item.group}</p>}
            <button
              className="pal-item"
              data-active={i === current}
              onMouseMove={() => i !== current && setActive(i)}
              onClick={() => choose(item)}
            >
              <span className="pal-icon">{item.icon}</span>
              <span className="pal-text">
                <span className="pal-label">{item.label}</span>
                {item.hint && <span className="pal-hint">{item.hint}</span>}
              </span>
              {i === current && <IconCornerDownLeft size={15} className="pal-enter" />}
            </button>
          </div>
        ))}
      </div>

      <div className="pal-foot">
        <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
        <span><kbd>↵</kbd> open</span>
        <span><kbd>esc</kbd> close</span>
      </div>
    </Modal>
  );
}
