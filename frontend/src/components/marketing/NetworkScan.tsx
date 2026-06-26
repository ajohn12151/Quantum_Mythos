import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * NetworkScan — the "Aegis reading the internet" showpiece. A constellation of
 * subdomain nodes: a blue scan sweep discovers them (lighting broken=red /
 * safe=green), then a second migration sweep flips the red ones to green — the
 * whole product thesis as ambient motion. Canvas-based, ~28 nodes (cheap),
 * `prefers-reduced-motion` safe (renders a single resolved frame).
 */
type Node = { x: number; y: number; broken: boolean; r: number };

const C = {
  idle: "120, 140, 165",
  scan: "60, 110, 215",
  broken: "205, 75, 75",
  safe: "70, 170, 120",
};
const CYCLE = 9000;
const SCAN_END = 3800;
const MIG_START = 5200;
const MIG_END = 8200;

export function NetworkScan({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let nodes: Node[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(16, Math.min(30, Math.floor(w / 34)));
      nodes = Array.from({ length: count }, (_, i) => ({
        x: (w / (count + 1)) * (i + 1) + (Math.random() - 0.5) * (w / count) * 0.7,
        y: h * (0.12 + Math.random() * 0.76),
        broken: Math.random() < 0.62,
        r: 2 + Math.random() * 2,
      }));
    };

    const draw = (t: number) => {
      const c = reduce ? CYCLE : t % CYCLE;
      const scanX = c < SCAN_END ? (c / SCAN_END) * w : w;
      const migProg = c > MIG_START ? Math.min(1, (c - MIG_START) / (MIG_END - MIG_START)) : 0;
      const migX = migProg * w;

      ctx.clearRect(0, 0, w, h);

      // links between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130 && a.x <= scanX && b.x <= scanX) {
            ctx.strokeStyle = `rgba(${C.scan}, ${(1 - d / 130) * 0.18})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // scan sweep line
      if (!reduce && c < SCAN_END) drawSweep(ctx, scanX, h, C.scan);
      // migration sweep line
      if (!reduce && c > MIG_START && migProg < 1) drawSweep(ctx, migX, h, C.safe);

      // nodes
      for (const n of nodes) {
        const discovered = n.x <= scanX;
        const migrated = n.broken && n.x <= migX;
        const color = !discovered ? C.idle : migrated ? C.safe : n.broken ? C.broken : C.safe;
        const justHit = Math.abs(n.x - scanX) < 16 && c < SCAN_END;
        const pulse = justHit ? 3.5 : 0;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${discovered ? 0.95 : 0.5})`;
        ctx.fill();
        // glow
        if (discovered) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color}, 0.1)`;
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [reduce]);

  return <canvas ref={ref} aria-hidden className={`h-full w-full ${className}`} />;
}

function drawSweep(ctx: CanvasRenderingContext2D, x: number, h: number, rgb: string) {
  const grad = ctx.createLinearGradient(x - 24, 0, x + 24, 0);
  grad.addColorStop(0, `rgba(${rgb}, 0)`);
  grad.addColorStop(0.5, `rgba(${rgb}, 0.35)`);
  grad.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(x - 24, 0, 48, h);
  ctx.strokeStyle = `rgba(${rgb}, 0.7)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, h);
  ctx.stroke();
}
