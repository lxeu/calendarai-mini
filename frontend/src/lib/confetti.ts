import { prefersReducedMotion } from "./motion";

const COLORS = ["#a78bfa", "#f0abfc", "#67e8f9", "#fde68a", "#86efac", "#fda4af"];

type Piece = {
  x: number; y: number; vx: number; vy: number;
  rot: number; vr: number; w: number; h: number;
  color: string; round: boolean; life: number;
};

// Fire a one-off burst of confetti on a throwaway full-screen canvas
export function confetti({ count = 120, x = 0.5, y = 0.45 } = {}) {
  if (prefersReducedMotion()) return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed", inset: "0", width: "100vw", height: "100vh",
    pointerEvents: "none", zIndex: "9999",
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.remove();

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const pieces: Piece[] = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = 7 + Math.random() * 9;
    return {
      x: W * x, y: H * y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      round: Math.random() < 0.3, life: 1,
    };
  });

  const start = performance.now();
  function frame(t: number) {
    ctx!.clearRect(0, 0, W, H);
    const elapsed = t - start;
    for (const p of pieces) {
      p.vy += 0.32;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life = Math.max(0, 1 - elapsed / 2600);
      ctx!.save();
      ctx!.globalAlpha = p.life;
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.fillStyle = p.color;
      if (p.round) {
        ctx!.beginPath();
        ctx!.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx!.fill();
      } else {
        // scaleY wobble makes the strips look like they're tumbling
        ctx!.scale(1, Math.cos(p.rot * 2));
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx!.restore();
    }
    if (elapsed < 2600) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
