import { useEffect, useState } from "react";

const STEPS = [
  "Reading your syllabus…",
  "Spotting due dates…",
  "Telling quizzes from finals…",
  "Double-checking every date…",
  "Almost there…",
];
const LINE_WIDTHS = [92, 74, 86, 58, 90, 68, 95, 50, 82, 64];
const HITS = new Set([2, 5, 8]);

// Delay each highlighted line so it lights up right as the scan beam passes it
// (line k sits 50 + 15k px down; the beam's bright edge moves ~106.7 px/s).
const hitDelay = (k: number) => `${((51.4 + 15 * k) / 106.67 - 1.152).toFixed(2)}s`;

// The "AI is reading" animation shown while the backend parses a syllabus
export default function ScanLoader() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((n) => Math.min(n + 1, STEPS.length - 1)), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="scan" role="status" aria-live="polite">
      <div className="scan-stage" aria-hidden="true">
        <div className="scan-doc">
          <div className="scan-doc-head" />
          {LINE_WIDTHS.map((w, k) => (
            <span
              key={k}
              className={`scan-line${HITS.has(k) ? " hit" : ""}`}
              style={{ width: `${w}%`, animationDelay: HITS.has(k) ? hitDelay(k) : undefined }}
            />
          ))}
          <div className="scan-beam" />
        </div>
        <span className="scan-spark s1" />
        <span className="scan-spark s2" />
        <span className="scan-spark s3" />
      </div>
      <p className="scan-text" key={step}>
        {STEPS[step]}
      </p>
      <div className="scan-progress">
        <span />
      </div>
    </div>
  );
}
