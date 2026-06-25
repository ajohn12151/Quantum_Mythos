import { useEffect, useRef } from "react";

/**
 * Interactive quantum particle field for the hero. Particles drift and link to
 * each other; near the pointer they gently part and the network reaches out to
 * connect to the cursor — alive and premium, but restrained (blue, low alpha).
 * `prefers-reduced-motion` renders a single static frame (no loop, no pointer).
 */
export function QuantumBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; vx: number; vy: number; r: number; dx: number; dy: number };
    let particles: P[] = [];

    // Pointer (relative to canvas); far offscreen until the mouse moves.
    let mx = -9999;
    let my = -9999;
    const REACH = 250; // cursor-link distance
    const PART = 185; // cursor "part" radius

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(135, Math.floor((width * height) / 9000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1.1 + Math.random() * 1.6,
        dx: 0,
        dy: 0,
      }));
    };

    const frame = () => {
      ctx.clearRect(0, 0, width, height);

      // Update positions + compute display offset (particles part around cursor).
      for (const p of particles) {
        if (!reduce) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }
        p.dx = p.x;
        p.dy = p.y;
        const ox = p.x - mx;
        const oy = p.y - my;
        const od2 = ox * ox + oy * oy;
        if (od2 < PART * PART) {
          const od = Math.sqrt(od2) || 1;
          const push = (1 - od / PART) * 34;
          p.dx += (ox / od) * push;
          p.dy += (oy / od) * push;
        }
      }

      // Particle-to-particle links.
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.dx - b.dx;
          const dy = a.dy - b.dy;
          const d2 = dx * dx + dy * dy;
          if (d2 < 190 * 190) {
            const alpha = (1 - Math.sqrt(d2) / 190) * 0.6;
            const grad = ctx.createLinearGradient(a.dx, a.dy, b.dx, b.dy);
            grad.addColorStop(0, `rgba(55, 105, 220, ${alpha})`);
            grad.addColorStop(1, `rgba(95, 170, 235, ${alpha})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(a.dx, a.dy);
            ctx.lineTo(b.dx, b.dy);
            ctx.stroke();
          }
        }
      }

      // Cursor links — the network reaches out to the pointer.
      for (const p of particles) {
        const dx = p.dx - mx;
        const dy = p.dy - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < REACH * REACH) {
          const alpha = (1 - Math.sqrt(d2) / REACH) * 0.72;
          ctx.strokeStyle = `rgba(65, 125, 240, ${alpha})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(p.dx, p.dy);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }
      }

      // Particles (those near the cursor brighten + grow a touch).
      for (const p of particles) {
        const dx = p.dx - mx;
        const dy = p.dy - my;
        const near = dx * dx + dy * dy < REACH * REACH;
        ctx.fillStyle = near ? "rgba(65, 125, 240, 1)" : "rgba(58, 108, 220, 0.68)";
        ctx.beginPath();
        ctx.arc(p.dx, p.dy, near ? p.r + 1.4 : p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduce) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    };
    const onLeave = () => {
      mx = -9999;
      my = -9999;
    };

    resize();
    frame();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    if (!reduce) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseout", onLeave);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, []);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{
        maskImage: "linear-gradient(to bottom, black 50%, transparent 82%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 82%)",
      }}
    >
      {/* Interactive particle field — the aurora is handled by <AuroraBackground />. */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-90" />
    </div>
  );
}
