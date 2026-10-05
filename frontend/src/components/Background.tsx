import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/motion";

type Star = { x: number; y: number; z: number; vx: number; vy: number; tw: number };

// The animated backdrop behind every page: aurora blobs, a fading grid, a
// starfield that links up to your cursor, and a spotlight that follows it.
// It also feeds the cursor position to CSS (--mx/--my, --px/--py) and to any
// ".glow" card under the pointer (--gx/--gy) for the hover-light effect.
export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const reduce = prefersReducedMotion();
    let px = -9999;
    let py = -9999;
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let raf = 0;
    let moveRaf = 0;
    let lastMove: PointerEvent | null = null;

    function onMove(e: PointerEvent) {
      lastMove = e;
      if (moveRaf) return;
      moveRaf = requestAnimationFrame(() => {
        moveRaf = 0;
        const ev = lastMove!;
        px = ev.clientX;
        py = ev.clientY;
        root.style.setProperty("--mx", `${px}px`);
        root.style.setProperty("--my", `${py}px`);
        root.style.setProperty("--px", (px / window.innerWidth - 0.5).toFixed(3));
        root.style.setProperty("--py", (py / window.innerHeight - 0.5).toFixed(3));
        const card = (ev.target as Element | null)?.closest?.(".glow") as HTMLElement | null;
        if (card) {
          const r = card.getBoundingClientRect();
          card.style.setProperty("--gx", `${ev.clientX - r.left}px`);
          card.style.setProperty("--gy", `${ev.clientY - r.top}px`);
        }
        if (reduce) draw(0);
      });
    }

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(120, (w * h) / 11000));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.25 + Math.random() * 0.75,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.04 - Math.random() * 0.1,
        tw: Math.random() * Math.PI * 2,
      }));
      if (reduce) draw(0);
    }

    function draw(t: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const ox = px > -9999 ? (px - w / 2) * 0.02 : 0;
      const oy = py > -9999 ? (py - h / 2) * 0.02 : 0;
      for (const s of stars) {
        if (!reduce) {
          s.x += s.vx * s.z;
          s.y += s.vy * s.z;
          if (s.y < -10) s.y = h + 10;
          if (s.x < -10) s.x = w + 10;
          if (s.x > w + 10) s.x = -10;
        }
        // nearer stars (bigger z) drift further with the cursor: cheap parallax
        const x = s.x - ox * s.z;
        const y = s.y - oy * s.z;
        const twinkle = reduce ? 1 : 0.65 + 0.35 * Math.sin(t * 0.0018 + s.tw);
        ctx.fillStyle = `rgba(226, 220, 255, ${(0.2 + 0.6 * s.z) * twinkle})`;
        ctx.beginPath();
        ctx.arc(x, y, 0.4 + s.z * 1.1, 0, Math.PI * 2);
        ctx.fill();
        const dx = x - px;
        const dy = y - py;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 150) {
          ctx.strokeStyle = `rgba(196, 181, 253, ${(1 - d / 150) * 0.4})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      }
    }

    function loop(t: number) {
      draw(t);
      raf = requestAnimationFrame(loop);
    }

    function onVisibility() {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduce) raf = requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduce) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(moveRaf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="bg" aria-hidden="true">
      <div className="bg-aurora">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
        <span className="blob b4" />
      </div>
      <div className="bg-grid" />
      <canvas className="bg-stars" ref={canvasRef} />
      <div className="bg-spot" />
      <div className="bg-noise" />
    </div>
  );
}
