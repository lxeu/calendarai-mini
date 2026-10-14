export default function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="26" height="23" rx="5" fill="var(--ink)" />
      <path d="M10 3v6M22 3v6" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="18" y="19" width="6" height="6" rx="1.5" fill="var(--accent)" />
    </svg>
  );
}
