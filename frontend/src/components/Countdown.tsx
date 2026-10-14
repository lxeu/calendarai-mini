import { useNow } from "../lib/clock";
import { endOfDay } from "../lib/dates";

// Live countdown to the end of a due date, e.g. "2d 14h 05m left"
export default function Countdown({ date }: { date: string }) {
  const now = useNow();
  const target = endOfDay(date);
  if (target === null) return null;

  const left = Math.max(0, target - now);
  const days = Math.floor(left / 86_400_000);
  const hours = Math.floor(left / 3_600_000) % 24;
  const minutes = Math.floor(left / 60_000) % 60;

  return (
    <p className="countdown" role="timer" aria-label={`${days} days and ${hours} hours left`}>
      {days > 0 && <>{days}d </>}
      {hours}h {String(minutes).padStart(2, "0")}m left
    </p>
  );
}
