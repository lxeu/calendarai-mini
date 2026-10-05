import { useNow } from "../lib/clock";
import { endOfDay } from "../lib/dates";

// Live ticking countdown to the end of a due date
export default function Countdown({ date }: { date: string }) {
  const now = useNow();
  const target = endOfDay(date);
  if (target === null) return null;

  const left = Math.max(0, target - now);
  const units = [
    ["days", Math.floor(left / 86_400_000)],
    ["hrs", Math.floor(left / 3_600_000) % 24],
    ["min", Math.floor(left / 60_000) % 60],
    ["sec", Math.floor(left / 1000) % 60],
  ] as const;

  return (
    <div className="countdown" role="timer" aria-label={`${units[0][1]} days and ${units[1][1]} hours left`}>
      {units.map(([label, value]) => (
        <div className="cd-unit" key={label}>
          <span className="cd-num">
            <span key={value} className="cd-flip">
              {String(value).padStart(2, "0")}
            </span>
          </span>
          <span className="cd-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
