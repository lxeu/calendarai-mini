import Logo from "./Logo";

export default function LoadingScreen() {
  return (
    <div className="loading-screen" role="status">
      <Logo size={24} />
      <p className="muted">
        <span className="spinner" /> Loading
      </p>
    </div>
  );
}
