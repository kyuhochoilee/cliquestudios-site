"use client";

import { useRef, useEffect, useCallback } from "react";

const GLYPHS = [
  "#", "+", "x", "*", "%", "@", "=", "~",
  "/", "\\", "|", "-", ":", ";", "^", "!",
  "[", "]", "{", "}", "<", ">", "&", "$",
];

// Warm light palette, shifting on a slow loop.
const PALETTE_LIGHT = [
  { pos: 0, r: 255, g: 210, b: 100 },
  { pos: 0.25, r: 255, g: 170, b: 80 },
  { pos: 0.5, r: 255, g: 140, b: 120 },
  { pos: 0.75, r: 255, g: 180, b: 140 },
  { pos: 1, r: 255, g: 220, b: 130 },
];

// Teal dark palette.
const PALETTE_DARK = [
  { pos: 0, r: 30, g: 160, b: 150 },
  { pos: 0.25, r: 35, g: 185, b: 170 },
  { pos: 0.5, r: 45, g: 212, b: 191 },
  { pos: 0.75, r: 40, g: 190, b: 175 },
  { pos: 1, r: 30, g: 165, b: 155 },
];

const TIME_SPEED = 0.012;     // palette shift speed (slower)
const GLYPH_SPEED = 0.6;      // glyph swap speed (slower)
const FLICKER_SPEED = 1.0;    // edge flicker
const DOT_SPACING = 16;       // px between glyphs
const BASE_SIZE = 12;         // glyph font size
const BORDER = 3;             // edge-fade thickness
const BASE_ALPHA = 0.18;      // baseline opacity — kept low so text reads
const PULSE_AMOUNT = 0.25;    // pulse adds up to this on top of base

type ColorStop = { r: number; g: number; b: number; pos: number };

function lerpColor(stops: ColorStop[], t: number) {
  const clamped = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < stops.length - 1 && stops[i + 1].pos < clamped) i++;
  if (i >= stops.length - 1) {
    const s = stops[stops.length - 1];
    return { r: s.r, g: s.g, b: s.b };
  }
  const a = stops[i];
  const b = stops[i + 1];
  const local = (clamped - a.pos) / (b.pos - a.pos);
  return {
    r: Math.round(a.r + (b.r - a.r) * local),
    g: Math.round(a.g + (b.g - a.g) * local),
    b: Math.round(a.b + (b.b - a.b) * local),
  };
}

export default function AsciiGlimmer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const darkRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0, cols: 0, rows: 0 });
  const lastFrameRef = useRef(0);

  // Detect + watch dark mode
  useEffect(() => {
    const compute = () => {
      const systemDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const classDark =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark");
      const lightOverride =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("light-override");
      darkRef.current = lightOverride ? false : (classDark || systemDark);
    };
    compute();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => compute();
    mq.addEventListener("change", onMq);
    const observer = new MutationObserver(compute);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      mq.removeEventListener("change", onMq);
      observer.disconnect();
    };
  }, []);

  // Reset buffer on resize
  useEffect(() => {
    const onResize = () => {
      sizeRef.current = { w: 0, h: 0, cols: 0, rows: 0 };
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Throttle to ~30fps — gentle, not demanding
    const now = performance.now();
    if (now - lastFrameRef.current < 33) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }
    lastFrameRef.current = now;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const pixelW = Math.round(rect.width * dpr);
    const pixelH = Math.round(rect.height * dpr);

    const cols = Math.ceil(rect.width / DOT_SPACING) + 2;
    const rows = Math.ceil(rect.height / DOT_SPACING) + 2;

    if (
      sizeRef.current.w !== pixelW ||
      sizeRef.current.h !== pixelH ||
      sizeRef.current.cols !== cols ||
      sizeRef.current.rows !== rows
    ) {
      canvas.width = pixelW;
      canvas.height = pixelH;
      sizeRef.current = { w: pixelW, h: pixelH, cols, rows };
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const time = timeRef.current;
    timeRef.current += TIME_SPEED;

    const dark = darkRef.current;
    const PALETTE = dark ? PALETTE_DARK : PALETTE_LIGHT;

    ctx.font = `400 ${BASE_SIZE}px "GT Alpina Typewriter Trial", "Courier New", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    // Pulse center radius — expands/contracts slowly
    const maxR = Math.min(rect.width, rect.height) * 0.55;
    const pulseR = maxR * (0.6 + 0.4 * Math.sin(time * 1.2));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * DOT_SPACING;
        const y = row * DOT_SPACING;

        // Edge flicker — thin out near the viewport edges
        const distFromEdgeCol = Math.min(col, cols - 1 - col);
        const distFromEdgeRow = Math.min(row, rows - 1 - row);
        const edgeDist = Math.min(distFromEdgeCol, distFromEdgeRow);
        if (edgeDist < BORDER) {
          const tick = Math.floor(time * FLICKER_SPEED);
          const hash =
            Math.sin(col * 127.1 + row * 311.7 + tick * 17.3) * 43758.5453;
          const rand = hash - Math.floor(hash);
          if (rand > edgeDist / BORDER) continue;
        }

        // Radial pulse — glyphs near pulseR shine a bit brighter
        const dx = x - cx;
        const dy = y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        const pulseDist = Math.abs(d - pulseR);
        const pulseRingWidth = maxR * 0.25;
        const pulseInfluence = Math.max(
          0,
          1 - pulseDist / pulseRingWidth,
        );

        // Palette position — driven by row + subtle column wave + time
        const tColor =
          (row + Math.sin(time * 0.6 + col * 0.15) * 1.2) / (rows - 1);
        const c = lerpColor(PALETTE, tColor);

        // Alpha — base + pulse bump
        const alpha = BASE_ALPHA + pulseInfluence * PULSE_AMOUNT;

        // Glyph — slowly rotates through the set
        const glyphWave = Math.floor(
          time * GLYPH_SPEED + col * 0.7 + row * 0.5,
        );
        const baseIndex = (col * 7 + row * 13) % GLYPHS.length;
        const glyph = GLYPHS[(baseIndex + glyphWave) % GLYPHS.length];

        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
        ctx.fillText(glyph, x, y);
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      // Draw one static frame, no loop
      const canvas = canvasRef.current;
      if (canvas) {
        // force a single draw by scheduling once
        animRef.current = requestAnimationFrame(() => {
          draw();
          cancelAnimationFrame(animRef.current);
        });
      }
      return;
    }
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
