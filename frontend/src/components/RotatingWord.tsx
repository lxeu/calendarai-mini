import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../lib/motion";

// Cycles through words with a slide-up animation
export default function RotatingWord({ words, interval = 2200 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);

  return (
    <span className="rotator">
      <span key={i} className="rotator-word">
        {words[i]}
      </span>
    </span>
  );
}
