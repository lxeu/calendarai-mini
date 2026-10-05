import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/motion";

// A number that rolls up to its new value whenever it changes
export default function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);

  useEffect(() => {
    const from = shownRef.current;
    const start = performance.now();
    const instant = prefersReducedMotion();
    let raf = requestAnimationFrame(function step(t) {
      const p = instant ? 1 : Math.min(1, (t - start) / duration);
      const v = Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3)));
      shownRef.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{shown}</>;
}
