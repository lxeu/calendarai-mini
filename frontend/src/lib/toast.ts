// Tiny toast bus: call toast() from anywhere, <Toaster /> shows them.
export type ToastKind = "success" | "error" | "info";
export type Toast = { id: number; kind: ToastKind; message: string };

type Listener = (t: Toast) => void;
const listeners = new Set<Listener>();
let nextId = 1;

export function toast(message: string, kind: ToastKind = "info") {
  const t = { id: nextId++, kind, message };
  listeners.forEach((l) => l(t));
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
