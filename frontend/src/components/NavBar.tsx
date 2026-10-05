import { useState, type CSSProperties } from "react";
import { NavLink, useLocation } from "react-router";
import Logo from "./Logo";
import { IconCalendar, IconLogout, IconSearch, IconSparkles } from "./Icons";
import { modKey } from "../lib/platform";

type Props = {
  email: string;
  avatarUrl?: string;
  onSignOut: () => void;
  onOpenPalette: () => void;
};

export default function NavBar({ email, avatarUrl, onSignOut, onOpenPalette }: Props) {
  const { pathname } = useLocation();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const activeTab = pathname.startsWith("/add") ? 1 : 0;

  return (
    <header className="nav-wrap">
      <nav className="nav">
        <NavLink to="/" className="brand" aria-label="CalendarAI Mini home">
          <Logo size={30} />
          <span className="brand-name">
            CalendarAI<span className="brand-mini">mini</span>
          </span>
        </NavLink>

        <div className="seg" style={{ "--i": activeTab } as CSSProperties}>
          <span className="seg-ind" aria-hidden="true" />
          <NavLink to="/" end className="seg-link">
            <IconCalendar size={16} />
            <span>Calendar</span>
          </NavLink>
          <NavLink to="/add" className="seg-link">
            <IconSparkles size={16} />
            <span>Add syllabus</span>
          </NavLink>
        </div>

        <div className="nav-right">
          <button className="cmdk-btn" onClick={onOpenPalette} aria-label="Search and commands">
            <IconSearch size={16} />
            <span className="cmdk-text">Search</span>
            <kbd>{modKey} K</kbd>
          </button>
          <div className="user" title={email}>
            {avatarUrl && !avatarFailed ? (
              <img
                className="avatar"
                src={avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span className="avatar avatar-fallback" aria-hidden="true">
                {(email[0] ?? "?").toUpperCase()}
              </span>
            )}
            <span className="user-email">{email}</span>
          </div>
          <button className="btn btn-ghost btn-sm signout" onClick={onSignOut} aria-label="Sign out">
            <IconLogout size={16} />
            <span className="signout-text">Sign out</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
