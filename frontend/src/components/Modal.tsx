import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  label: string;
  // Leave out onClose for dialogs that must be answered (no Escape, no backdrop click)
  onClose?: () => void;
  className?: string;
  overlayClassName?: string;
  children: ReactNode;
};

// Rendered into <body> so page animations and blurred cards can't trap it
export default function Modal({ label, onClose, className = "", overlayClassName = "", children }: Props) {
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (!onClose) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose!();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className={`overlay ${overlayClassName}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
