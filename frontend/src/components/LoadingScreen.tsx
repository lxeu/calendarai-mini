import Logo from "./Logo";

export default function LoadingScreen() {
  return (
    <div className="loading-screen" role="status">
      <div className="loading-mark">
        <span className="loading-ring" />
        <Logo size={44} />
      </div>
      <p>Loading your semester…</p>
    </div>
  );
}
