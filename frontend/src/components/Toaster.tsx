import { useEffect, useState } from "react";
import { subscribeToasts, type Toast } from "../lib/toast";
import { IconAlert, IconCheck, IconInfo, IconX } from "./Icons";

type Item = Toast & { leaving?: boolean };

const LIFETIME = 4500;

export default function Toaster() {
  const [items, setItems] = useState<Item[]>([]);

  function dismiss(id: number) {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 320);
  }

  useEffect(
    () =>
      subscribeToasts((t) => {
        setItems((prev) => [...prev.slice(-3), t]);
        setTimeout(() => setItems((prev) => prev.map((x) => (x.id === t.id ? { ...x, leaving: true } : x))), LIFETIME);
        setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), LIFETIME + 320);
      }),
    [],
  );

  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}${t.leaving ? " leaving" : ""}`}>
          <span className="toast-icon">
            {t.kind === "success" ? <IconCheck /> : t.kind === "error" ? <IconAlert /> : <IconInfo />}
          </span>
          <span className="toast-msg">{t.message}</span>
          <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
            <IconX size={14} />
          </button>
          <i className="toast-timer" style={{ animationDuration: `${LIFETIME}ms` }} />
        </div>
      ))}
    </div>
  );
}
