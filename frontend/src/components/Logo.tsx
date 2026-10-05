import { useId } from "react";

export default function Logo({ size = 32 }: { size?: number }) {
  const id = "logo" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="2" y1="4" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" />
          <stop offset="0.5" stopColor="#e879f9" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="2" y="5" width="28" height="25" rx="8" fill={`url(#${id})`} />
      <path d="M10 2.75v4.5M22 2.75v4.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path className="logo-spark" d="M16 10.25l1.75 4.5 4.5 1.75-4.5 1.75L16 22.75l-1.75-4.5-4.5-1.75 4.5-1.75z" fill="#fff" />
    </svg>
  );
}
