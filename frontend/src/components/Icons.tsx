import {
  ArrowRight, Bell, Calendar, Check, CheckCheck, CornerDownLeft, Download, ExternalLink, Eye, EyeOff, FilePlus,
  FileText, Info, LogOut, Plus, Search, Send, Trash, TriangleAlert, Upload, Users, X, Pencil,
  type LucideProps,
} from "lucide-react";

// One icon set (Lucide), one stroke weight, 16px unless a call site says otherwise
const base = { size: 16, strokeWidth: 1.75, "aria-hidden": true } as const;

export const IconArrowRight = (p: LucideProps) => <ArrowRight {...base} {...p} />;
export const IconBell = (p: LucideProps) => <Bell {...base} {...p} />;
export const IconCalendar = (p: LucideProps) => <Calendar {...base} {...p} />;
export const IconCheck = (p: LucideProps) => <Check {...base} {...p} />;
export const IconChecks = (p: LucideProps) => <CheckCheck {...base} {...p} />;
export const IconCornerDownLeft = (p: LucideProps) => <CornerDownLeft {...base} {...p} />;
export const IconDownload = (p: LucideProps) => <Download {...base} {...p} />;
export const IconExternal = (p: LucideProps) => <ExternalLink {...base} {...p} />;
export const IconEye = (p: LucideProps) => <Eye {...base} {...p} />;
export const IconEyeOff = (p: LucideProps) => <EyeOff {...base} {...p} />;
export const IconFile = (p: LucideProps) => <FileText {...base} {...p} />;
export const IconFilePlus = (p: LucideProps) => <FilePlus {...base} {...p} />;
export const IconInfo = (p: LucideProps) => <Info {...base} {...p} />;
export const IconLogout = (p: LucideProps) => <LogOut {...base} {...p} />;
export const IconPencil = (p: LucideProps) => <Pencil {...base} {...p} />;
export const IconPlus = (p: LucideProps) => <Plus {...base} {...p} />;
export const IconSearch = (p: LucideProps) => <Search {...base} {...p} />;
export const IconSend = (p: LucideProps) => <Send {...base} {...p} />;
export const IconTrash = (p: LucideProps) => <Trash {...base} {...p} />;
export const IconAlert = (p: LucideProps) => <TriangleAlert {...base} {...p} />;
export const IconUpload = (p: LucideProps) => <Upload {...base} {...p} />;
export const IconUsers = (p: LucideProps) => <Users {...base} {...p} />;
export const IconX = (p: LucideProps) => <X {...base} {...p} />;

// Google's own mark, kept in its brand colors on the sign-in button
export function IconGoogle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}
