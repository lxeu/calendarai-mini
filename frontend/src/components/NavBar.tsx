import { useState } from "react";
import { NavLink } from "react-router";
import Logo from "./Logo";
import { IconLogout, IconSearch } from "./Icons";
import { modKey } from "../lib/platform";

type Props = {
  email: string;
  avatarUrl?: string;
  onSignOut: () => void;
  onOpenPalette: () => void;
};

export default function NavBar({ email, avatarUrl, onSignOut, onOpenPalette }: Props) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  return (
    <header className="nav-wrap">
      <nav className="nav container">
        <NavLink to="/" className="brand" aria-label="CalendarAI Mini home">
          <Logo />
          <span className="brand-name">CalendarAI Mini</span>
        </NavLink>

        <div className="tabs">
          <NavLink to="/" end className="tab">
            Calendar
          </NavLink>
          <NavLink to="/add" className="tab">
            Add syllabus
          </NavLink>
          <NavLink to="/buddy" className="tab">
            Study buddy
          </NavLink>
        </div>

        <div className="nav-right">
          <button className="search-btn" onClick={onOpenPalette} aria-label="Search and commands">
            <IconSearch />
            <span className="search-text">Search</span>
            <kbd>{modKey} K</kbd>
          </button>
          <span className="user" title={email}>
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
          </span>
          <button className="icon-btn" onClick={onSignOut} aria-label="Sign out" title="Sign out">
            <IconLogout />
          </button>
        </div>
      </nav>
    </header>
  );
}
