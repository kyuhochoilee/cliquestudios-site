"use client";

import { useEffect, useRef } from "react";
import { ACCESSORIES, CAST, EMOTES, IMPACTS, INKS, makeAccessory, makeFace, mixInks, roundedPolygon, type Char, type InkPass } from "./cast";

/**
 * Five ink creatures on a sheet of paper. Physics and a small state machine
 * run every frame; the DOM is written 12 times a second so the motion reads
 * like stop motion. See cast.ts for who they are.
 */

const FPS = 24; // motion at 24, the outline boil still re-rolls at 12
const Z_LIFE = 2.6; // seconds a sleep Z takes to float away
// ink passes for the marks above the head (bottom to top); a black pass sits under each, a hair off
const EMOTE_INKS: Record<string, InkPass[]> = {
  laugh: [{ ink: "yellow", a: 1 }, { ink: "pink", a: 0.8 }], // orange
  angry: [{ ink: "pink", a: 1 }, { ink: "yellow", a: 0.55 }], // red
  bang: [{ ink: "yellow", a: 1 }],
  q: [{ ink: "blue", a: 1 }],
  heart: [{ ink: "pink", a: 1 }],
  dizzy: [{ ink: "blue", a: 1 }, { ink: "pink", a: 0.8 }], // purple
};
// ink stacks an impact burst can be printed in
const IMPACT_INKS: InkPass[][] = [
  [{ ink: "pink", a: 1 }],
  [{ ink: "yellow", a: 1 }],
  [{ ink: "blue", a: 1 }],
  [{ ink: "yellow", a: 1 }, { ink: "pink", a: 0.85 }],
  [{ ink: "yellow", a: 1 }, { ink: "blue", a: 0.7 }],
  [{ ink: "pink", a: 1 }, { ink: "blue", a: 0.75 }],
];
const Z_PATHS = [
  "M3.5 4.5 C7 3.5 11 4 15.5 3.5 L4 15.5 C8 15 12 15.5 16.5 15",
  "M3 4 C6.5 4.5 10.5 3 15 4 L4.5 15 C9 16 12.5 14.5 16 15.5",
  "M4 3.5 C8 4 12 3 16 4.5 L3.5 16 C7.5 15.5 11 16.5 15.5 15",
];
const FRAME = 1 / FPS;
const TAU = Math.PI * 2;

type StateName =
  | "idle" | "wander" | "nap" | "curious" | "startled" | "chase"
  | "greet" | "sulk" | "celebrate" | "grabbed" | "thrown";

type Hop = {
  phase: "ant" | "air" | "land" | "rec";
  f: number;
  frames: number;
  dx: number;
  dy: number;
  power: number;
  ground: boolean;
};

type Step = {
  phase: "ant" | "move" | "land";
  f: number;
  frames: number;
  moveFrames: number;
  landFrames: number;
  dx: number;
  dy: number;
  len: number;
  stretch: number;
};

type Gaze =
  | { kind: "blob"; blob: Blob }
  | { kind: "pointer" }
  | { kind: "point"; x: number; y: number };

type Blob = {
  c: Char;
  i: number;
  el: HTMLDivElement;
  shadow: HTMLDivElement;
  pop: HTMLDivElement;
  body: SVGSVGElement;
  paths: SVGPathElement[];
  face: SVGSVGElement;
  eyesG: SVGGElement | null;
  pupils: SVGGElement[];
  pupilRange: number[];
  lids: { el: SVGElement; span: number }[];
  lidlos: { el: SVGElement; span: number }[];
  browsG: SVGElement | null;
  brows: SVGElement[];
  emote: SVGSVGElement;
  emoteG: SVGGElement;
  emoteUnder: SVGGElement;
  emoteInk1: SVGGElement;
  hovered: boolean; pressAt: number; pressX: number; pressY: number;
  bornAt: number; popped: boolean;
  tapCount: number; lastTap: number;
  emoteKind: string; emoteBorn: number; emoteDur: number; nextEmote: number;
  impact: SVGSVGElement; impactBorn: number; impactX: number; impactY: number; impactAngle: number; impactSize: number;
  impactUnder: SVGGElement; impactInk0: SVGGElement; impactInk1: SVGGElement;
  ax: number; axUntil: number; anchorX: number; anchorY: number; // squash axis + anchor after a push
  mouth: SVGElement | null;
  d: number;
  r: number;
  scale: number;
  x: number; y: number; vx: number; vy: number;
  heading: number; hv: number; tilt: number;
  s: number; sv: number; q: number; qv: number;
  sTarget: number; qTarget: number;
  ex: number; ey: number; evx: number; evy: number;
  gaze: Gaze | null; gazeW: number; gazeUntil: number;
  eyeScale: number; eyeScaleUntil: number; squint: number;
  blinkAt: number; blinkUntil: number; winking: boolean; secondBlinkAt: number;
  happyUntil: number; dilate: boolean; grinUntil: number;
  cheeks: SVGElement | null;
  zs: { el: SVGElement; path: SVGPathElement; born: number; dx: number; rot: number }[]; // sleep Z's
  nextZ: number;
  tremble: number; boilMul: number; hold: number;
  state: StateName; prev: StateName; stateT: number; until: number; nextThink: number;
  partner: Blob | null; grudge: Blob | null; role: "chaser" | "flee" | null; initiator: boolean;
  greetPhase: number; hopsLeft: number; nextHopAt: number; spin: number;
  curiousT: Gaze | null;
  mood: number; fatigue: number; napping: boolean;
  hop: Hop | null; alt: number; shKick: number; power: number;
  coolGreet: number; coolStartle: number; coolCurious: number; coolPuff: number;
  startleAt: number; startleX: number; startleY: number; startlePower: number; celebrateAt: number;
  tx: number; ty: number; retarget: number;
  nextDash: number; dashX: number; dashY: number; dt2: number;
  stp: Step | null; pending: { dx: number; dy: number; len: number; at: number } | null;
  hopQueue: number[]; sulkX: number; sulkY: number; dizzy: boolean; stepAt: number; stickUntil: number;
  grabbed: boolean; gx: number; gy: number; hist: { x: number; y: number; t: number }[];
  forceRender: boolean;
  last: Record<string, string>;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = Math.random;
const lerpAngle = (a: number, b: number, t: number) => {
  let d = b - a;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return a + d * t;
};
const q5deg = (a: number) => Math.round(a / (Math.PI / 36)) * (Math.PI / 36);
const q = (v: number, step: number) => (Math.round(v / step) * step).toFixed(3);

export default function Blobs() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 640;
    const count = CAST.length;
    const sizeMul = small ? 0.62 : 1;
    // things the cast keeps off: the note and the wordmark
    const keepEls = Array.from(root.parentElement?.querySelectorAll<HTMLElement>("[data-keep]") ?? []);

    // ---------- world ----------
    type Rect = { l: number; t: number; r: number; b: number };
    let W = 0;
    let H = 0;
    let keeps: Rect[] = [];
    const measure = () => {
      const rr = root.getBoundingClientRect();
      W = rr.width;
      H = rr.height;
      const m = 18;
      keeps = keepEls.map((el) => {
        const c = el.getBoundingClientRect();
        return { l: c.left - rr.left - m, t: c.top - rr.top - m, r: c.right - rr.left + m, b: c.bottom - rr.top + m };
      });
    };
    measure();

    const pointer = { x: -9999, y: -9999, known: false, vx: 0, vy: 0, speed: 0, lastT: 0, expire: 0 };
    let t = 0; // simulation seconds
    let chaseActive = false;

    const hitKeep = (x: number, y: number, r: number): Rect | null => {
      for (const k of keeps) if (x + r > k.l && x - r < k.r && y + r > k.t && y - r < k.b) return k;
      return null;
    };
    const inKeep = (x: number, y: number, r: number) => hitKeep(x, y, r) !== null;

    const openSpot = (r: number) => {
      let x = W / 2;
      let y = H / 2;
      for (let k = 0; k < 30; k++) {
        x = r + rand() * Math.max(1, W - r * 2);
        y = r + rand() * Math.max(1, H - r * 2);
        if (!inKeep(x, y, r)) break;
      }
      return { x, y };
    };
    const nudge = (x: number, y: number, r: number) => {
      x = clamp(x, r, W - r);
      y = clamp(y, r, H - r);
      const keep = hitKeep(x, y, r);
      if (!keep) return { x, y };
      const pl = x + r - keep.l, pr = keep.r - (x - r), pt = y + r - keep.t, pb = keep.b - (y - r);
      const m = Math.min(pl, pr, pt, pb);
      if (m === pl) x -= pl + 10; else if (m === pr) x += pr + 10; else if (m === pt) y -= pt + 10; else y += pb + 10;
      return { x: clamp(x, r, W - r), y: clamp(y, r, H - r) };
    };

    // ---------- build ----------
    const blobs: Blob[] = [];
    const releases: ((e: PointerEvent) => void)[] = [];
    const els = Array.from(root.children) as HTMLDivElement[];
    els.forEach((el, i) => {
      if (i >= count) {
        el.style.display = "none";
        return;
      }
      const c = CAST[i];
      const d = c.size * sizeMul;
      const scale = d / 100;
      el.style.width = `${d}px`;
      el.style.height = `${d}px`;
      const body = el.querySelector<SVGSVGElement>(".blob-body")!;
      const face = el.querySelector<SVGSVGElement>(".blob-face")!;
      // the body is printed as one pass per ink; the lids use what the stack prints as
      el.style.setProperty("--ink", mixInks(c.inks));
      body.style.setProperty("--falloff", `${c.falloff}deg`);
      body.classList.add(c.inks.some((p) => p.ink === "blue") ? "tex-dark" : "tex-light");
      const paths = Array.from(body.querySelectorAll<SVGPathElement>("path"));
      paths[0].style.fill = INKS[c.inks[0].ink];
      if (c.inks[1] && paths[1]) {
        paths[1].style.fill = INKS[c.inks[1].ink];
        paths[1].style.opacity = String(c.inks[1].a);
        paths[1].style.transform = `translate(${(1.6 / scale).toFixed(2)}px, ${(-0.9 / scale).toFixed(2)}px)`; // second drum, a hair off
      } else if (paths[1]) {
        paths[1].remove();
        paths.length = 1;
      }
      const g = body.querySelector("g");
      if (g) g.setAttribute("filter", d < 65 ? "url(#riso-edge-sm)" : "url(#riso-edge)");
      // a random accessory per visit; about one in four goes without
      const acc = rand() < 0.25 ? "none" : ACCESSORIES[1 + Math.floor(rand() * (ACCESSORIES.length - 1))];
      face.innerHTML = makeFace(c, c.name.toLowerCase()) + makeAccessory(acc, c);
      const r = (d * c.fill) / 2;
      const spot = openSpot(r);
      const way = openSpot(r);
      const b: Blob = {
        c, i, el, body, paths, face,
        shadow: el.querySelector<HTMLDivElement>(".blob-shadow")!,
        pop: el.querySelector<HTMLDivElement>(".blob-pop")!,
        eyesG: face.querySelector<SVGGElement>(".eyes"),
        pupils: Array.from(face.querySelectorAll<SVGGElement>(".pupils")),
        pupilRange: [c.eyes.l, c.eyes.r].map((e) => Math.max(0, e.r - e.pr - 1)),
        lids: Array.from(face.querySelectorAll<SVGElement>(".lid")).map((el) => ({ el, span: Number(el.getAttribute("data-span")) })),
        lidlos: Array.from(face.querySelectorAll<SVGElement>(".lidlo")).map((el) => ({ el, span: Number(el.getAttribute("data-span")) })),
        browsG: face.querySelector<SVGElement>(".brows"),
        brows: Array.from(face.querySelectorAll<SVGElement>(".brow")),
        emote: el.querySelector<SVGSVGElement>(".blob-emote")!,
        emoteG: el.querySelector<SVGGElement>(".blob-emote .over")!,
        emoteUnder: el.querySelector<SVGGElement>(".blob-emote .under")!,
        emoteInk1: el.querySelector<SVGGElement>(".blob-emote .ink1")!,
        hovered: false, pressAt: -9, pressX: 0, pressY: 0,
        bornAt: 0.6 + i * 0.8 + rand() * 0.1, popped: false, // one at a time
        tapCount: 0, lastTap: -9,
        impactBorn: -99, impactX: 0, impactY: 0, impactAngle: 0, impactSize: 1,
        impact: el.querySelector<SVGSVGElement>(".blob-impact")!,
        impactUnder: el.querySelector<SVGGElement>(".blob-impact .under")!,
        impactInk0: el.querySelector<SVGGElement>(".blob-impact .ink0")!,
        impactInk1: el.querySelector<SVGGElement>(".blob-impact .ink1")!,
        emoteKind: "", emoteBorn: -99, emoteDur: 0, nextEmote: 0,
        ax: 0, axUntil: 0, anchorX: 0, anchorY: 0,
        mouth: face.querySelector<SVGElement>(".mouth"),
        d, r, scale,
        x: spot.x, y: spot.y, vx: 0, vy: 0,
        heading: rand() * TAU, hv: 0, tilt: 0,
        s: 0, sv: 0, q: 0, qv: 0, sTarget: 0, qTarget: 0,
        ex: spot.x, ey: spot.y, evx: 0, evy: 0,
        gaze: null, gazeW: 0, gazeUntil: 0,
        eyeScale: 1, eyeScaleUntil: 0, squint: 0,
        blinkAt: 1 + rand() * 3, blinkUntil: 0, winking: false, secondBlinkAt: 0,
        happyUntil: 0, dilate: false, grinUntil: 0,
        cheeks: face.querySelector<SVGElement>(".cheeks"),
        zs: Array.from(el.querySelectorAll<SVGElement>(".blob-z")).map((z) => ({ el: z, path: z.querySelector("path")!, born: -99, dx: 0, rot: 0 })),
        nextZ: 0,
        tremble: 0, boilMul: 1, hold: c.hold,
        state: "idle", prev: "idle", stateT: 0, until: 1 + rand() * 2, nextThink: 0.5,
        partner: null, grudge: null, role: null, initiator: false,
        greetPhase: 0, hopsLeft: 0, nextHopAt: 0, spin: 1,
        curiousT: null,
        mood: 0, fatigue: 0, napping: false,
        hop: null, alt: 0, shKick: 0, power: 0,
        coolGreet: 0, coolStartle: 0, coolCurious: 0, coolPuff: 0,
        startleAt: 0, startleX: 0, startleY: 0, startlePower: 0, celebrateAt: 0,
        tx: way.x, ty: way.y, retarget: 3 + rand() * 4,
        nextDash: 1 + rand(), dashX: 1, dashY: 0, dt2: 0, stp: null, pending: null,
        hopQueue: [], sulkX: 0, sulkY: 0, dizzy: false, stepAt: 0, stickUntil: 0,
        grabbed: false, gx: 0, gy: 0, hist: [],
        forceRender: true,
        last: {},
      };
      blobs.push(b);
      b.pop.style.transformOrigin = `50% ${c.bottom}%`;
      b.shadow.style.top = `${c.bottom - 8}%`;

      el.addEventListener("pointerenter", () => { b.hovered = true; b.forceRender = true; });
      el.addEventListener("pointerleave", () => { b.hovered = false; b.forceRender = true; });
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        try { el.setPointerCapture(e.pointerId); } catch {}
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.known = true;
        pointer.expire = 0;
        b.grabbed = true;
        b.gx = e.clientX - b.x;
        b.gy = e.clientY - b.y;
        b.hist = [];
        b.pressAt = t;
        b.pressX = e.clientX;
        b.pressY = e.clientY;
        b.qv += 4 * sqGain(b); // pressed flat, then the held pose springs it tall
        el.classList.add("is-grabbed");
        go(b, "grabbed");
      });
      const release = (e: PointerEvent) => {
        if (!b.grabbed) return;
        b.grabbed = false;
        el.classList.remove("is-grabbed");
        if (e.pointerType === "touch") pointer.expire = t + 0.8;
        // a quick tap: each character reacts its own way, no throw
        if (t - b.pressAt < 0.28 && Math.hypot(e.clientX - b.pressX, e.clientY - b.pressY) < 8) {
          tapReact(b);
          return;
        }
        const past = b.hist.find((h) => t - h.t >= 0.06) ?? b.hist[0];
        let sp = 0;
        if (past && t - past.t > 0) {
          const dtp = t - past.t;
          b.vx = (b.x - past.x) / dtp;
          b.vy = (b.y - past.y) / dtp;
          sp = Math.hypot(b.vx, b.vy);
          const max = 2400 / Math.sqrt(b.c.mass);
          if (sp > max) { b.vx *= max / sp; b.vy *= max / sp; sp = max; }
        }
        if (sp > 500) go(b, "thrown");
        else {
          // let go: it falls from where it was held and lands with a thud
          b.vx = 0; b.vy = 0;
          go(b, "idle");
          b.until = t + 1.2;
          b.hop = { phase: "air", f: 3, frames: 6, dx: 0, dy: 0, power: 0.6, ground: false };
          b.power = 0.6;
          b.hold = 1;
        }
      };
      el.addEventListener("pointerup", release);
      el.addEventListener("pointercancel", release);
      el.addEventListener("lostpointercapture", release);
      releases.push(release);
    });
    // a held character is always let go when the button is no longer down, wherever the pointer is
    const releaseAll = (e: PointerEvent) => { for (const r of releases) r(e); };
    window.addEventListener("pointerup", releaseAll);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.buttons === 0) for (const r of releases) r(e); // button came up somewhere we didn't hear
      const now = performance.now();
      const dtp = Math.max(0.008, (now - pointer.lastT) / 1000);
      if (pointer.known && pointer.lastT) {
        const ivx = (e.clientX - pointer.x) / dtp;
        const ivy = (e.clientY - pointer.y) / dtp;
        pointer.vx = pointer.vx * 0.6 + ivx * 0.4;
        pointer.vy = pointer.vy * 0.6 + ivy * 0.4;
      }
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.lastT = now;
      pointer.known = true;
      pointer.expire = e.pointerType === "touch" ? t + 1.2 : 0;
      pointer.speed = Math.hypot(pointer.vx, pointer.vy);
    };
    const onLeave = () => { pointer.known = false; pointer.speed = 0; };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    window.addEventListener("resize", measure);

    // ---------- helpers ----------
    const sqGain = (b: Blob) => 0.6 + 0.8 * b.c.P.squishy;
    const vmax = (b: Blob) => 60 + 90 * b.c.P.speed;
    // Discrete steps instead of gliding: a push, a little bounce, then a dead stop.
    // A discrete shuffle: crouch a frame, move over a couple of frames, land and freeze. Never a glide.
    const step = (
      b: Blob, ux: number, uy: number, len: number, interval: number,
      opts: { ant?: number; move?: number; land?: number; stretch?: number } = {},
    ) => {
      if (t < b.stepAt || b.stp || b.hop) return false;
      b.stepAt = t + interval;
      const m = Math.pow(b.c.mass, 0.35); // heavy ones take shorter steps
      const ant = opts.ant ?? 1;
      b.stp = {
        phase: ant > 0 ? "ant" : "move", f: 0, frames: ant > 0 ? ant : opts.move ?? 2,
        moveFrames: opts.move ?? 2, landFrames: opts.land ?? 2,
        dx: ux, dy: uy, len: len / m, stretch: opts.stretch ?? 1,
      };
      b.vx = 0;
      b.vy = 0;
      b.heading = Math.atan2(uy, ux);
      if (b.c.nose === null) b.tilt = clamp(ux, -1, 1) * b.c.lean * 0.8;
      b.ax = b.heading;
      b.axUntil = t + 0.35;
      b.anchorX = 0;
      b.anchorY = 0;
      if (ant > 0) b.qv += 2 * sqGain(b); // crouch
      else {
        b.sv += 2.2 * b.stp.stretch * sqGain(b);
        b.qv -= 3 * sqGain(b);
        const v = (b.stp.len / b.stp.frames) * FPS; // move as velocity so bumps and walls still register
        b.vx = ux * v; b.vy = uy * v;
      }
      b.hold = 1;
      b.forceRender = true;
      return true;
    };
    // advance a shuffle once per rendered frame
    const tickStep = (b: Blob) => {
      const s = b.stp;
      if (!s) return;
      s.f++;
      if (s.phase === "ant") {
        if (s.f >= s.frames) {
          s.phase = "move"; s.f = 0; s.frames = s.moveFrames;
          b.sv += 2.2 * s.stretch * sqGain(b); // stretch into the move
          b.qv -= 3 * sqGain(b);
          const v = (s.len / s.frames) * FPS; // the move is velocity for exactly these frames
          b.vx = s.dx * v; b.vy = s.dy * v;
        }
      } else if (s.phase === "move") {
        if (s.f >= s.frames) {
          s.phase = "land"; s.f = 0; s.frames = s.landFrames;
          b.qv += 2.2 * sqGain(b); // land
          b.sv -= 1.2 * sqGain(b);
          b.evx += s.dx * s.len * 3; // eyes overshoot
          b.evy += s.dy * s.len * 3;
          b.vx = 0; b.vy = 0;
        }
      } else if (s.f >= s.frames) {
        b.stp = null;
        b.hold = b.hop ? 1 : b.c.hold;
      }
    };
    // A cartoon mark above the head for a moment.
    const showEmote = (b: Blob, kind: string, dur: number) => {
      if (b.emoteKind !== kind) {
        const glyph = EMOTES[kind] ?? "";
        const stack = kind === "pop" ? b.c.inks : EMOTE_INKS[kind] ?? [];
        b.emoteUnder.innerHTML = glyph;
        b.emoteG.innerHTML = glyph;
        b.emoteG.style.color = stack[0] ? INKS[stack[0].ink] : "";
        b.emoteInk1.innerHTML = stack[1] ? glyph : "";
        b.emoteInk1.style.color = stack[1] ? INKS[stack[1].ink] : "";
        b.emoteInk1.style.opacity = stack[1] ? String(stack[1].a) : "0";
        b.emoteKind = kind;
      }
      b.emoteBorn = t;
      b.emoteDur = dur;
      b.forceRender = true;
    };
    // What each character does when you tap it. Tap the same one three times fast and it gets annoyed (except Bop).
    const tapReact = (b: Blob) => {
      b.tapCount = t - b.lastTap < 2.5 ? b.tapCount + 1 : 1;
      b.lastTap = t;
      b.vx = 0; b.vy = 0;
      go(b, "idle");
      b.until = t + 1.6;
      if (b.tapCount >= 3 && b.c.name !== "Bop") {
        b.tapCount = 0;
        b.mood -= 0.5;
        go(b, "sulk", { grudge: null });
        return;
      }
      switch (b.c.name) {
        case "Fizz": // thrilled: a big hop and a "!"
          eyeWide(b, 0.5);
          showEmote(b, "bang", 0.9);
          startHop(b, 0, 0, 0.7);
          b.mood += 0.2;
          break;
        case "Loaf": // disturbed: a slow blink, a wobble, a "?"
          showEmote(b, rand() < 0.6 ? "q" : "dizzy", 1.2);
          b.blinkUntil = t + 0.45;
          b.qv += 2 * sqGain(b);
          b.fatigue = Math.max(0, b.fatigue - 0.2);
          break;
        case "Pip": // delighted: little hop, happy eyes, a heart
          startHop(b, 0, 0, 0.35);
          b.happyUntil = t + 1.3;
          showEmote(b, "heart", 1.3);
          b.mood += 0.3;
          break;
        case "Nib": { // bashful: blushes, happy eyes, sidesteps away from you
          b.happyUntil = t + 1.6;
          showEmote(b, "heart", 1.4);
          b.coolPuff = t + 5;
          const ax = b.x - pointer.x, ay = b.y - pointer.y;
          const ad = Math.hypot(ax, ay) || 1;
          b.stepAt = 0;
          step(b, ax / ad, ay / ad, 40, 0.5);
          b.mood += 0.2;
          break;
        }
        default: // Bop: three hops and a laugh
          b.tx = b.x; b.ty = b.y;
          startHop(b, 0, 0, 0.35);
          b.hopQueue = [0.45, 0.6];
          b.happyUntil = t + 1.6;
          showEmote(b, "laugh", 1.6);
          b.mood += 0.3;
      }
    };
    // A shove becomes a stumble (one discrete step) instead of a slide.
    const stumble = (b: Blob, vx: number, vy: number, delay = 0) => {
      const sp = Math.hypot(vx, vy);
      b.vx = 0;
      b.vy = 0;
      if (sp < 40) return;
      b.pending = { dx: vx / sp, dy: vy / sp, len: Math.min(70, sp * 0.09), at: t + delay };
    };
    const dist = (a: { x: number; y: number }, c: { x: number; y: number }) => Math.hypot(c.x - a.x, c.y - a.y);

    const lookAt = (b: Blob, g: Gaze, w: number, dur: number) => { b.gaze = g; b.gazeW = w; b.gazeUntil = t + dur; };
    const gazePos = (b: Blob, g: Gaze) => {
      if (g.kind === "blob") return { x: g.blob.x, y: g.blob.y };
      if (g.kind === "pointer") return pointer.known ? { x: pointer.x, y: pointer.y } : { x: b.x, y: b.y };
      return { x: g.x, y: g.y };
    };
    const eyeWide = (b: Blob, dur: number) => { b.eyeScale = 1.35; b.eyeScaleUntil = t + dur; b.forceRender = true; };
    const nearest = (b: Blob, max: number) => {
      let best: Blob | null = null;
      let bd = max;
      for (const o of blobs) {
        if (o === b) continue;
        const dd = dist(b, o);
        if (dd < bd) { bd = dd; best = o; }
      }
      return best;
    };
    const greetable = (b: Blob) =>
      (b.state === "idle" || b.state === "wander") && b.coolGreet < t && !b.napping;

    const pickWaypoint = (b: Blob) => {
      const c = b.c;
      let p: { x: number; y: number };
      if (c.name === "Pip") {
        if (pointer.known) {
          const dx = b.x - pointer.x, dy = b.y - pointer.y;
          const dd = Math.hypot(dx, dy) || 1;
          p = nudge(pointer.x + (dx / dd) * 140, pointer.y + (dy / dd) * 140, b.r);
          b.retarget = t + 1.2;
        } else {
          const n = nearest(b, Infinity);
          if (n) {
            const dx = b.x - n.x, dy = b.y - n.y;
            const dd = Math.hypot(dx, dy) || 1;
            p = nudge(n.x + (dx / dd) * (n.r + b.r + 20), n.y + (dy / dd) * (n.r + b.r + 20), b.r);
          } else p = openSpot(b.r);
          b.retarget = t + 2 + 2 * rand();
        }
      } else if (c.name === "Loaf") {
        const a = rand() * TAU;
        const L = 100 + 100 * rand();
        p = nudge(b.x + Math.cos(a) * L, b.y + Math.sin(a) * L, b.r);
        b.retarget = t + 9 + 7 * rand();
      } else {
        if (c.P.social > 0.6 && rand() < 0.4) {
          const n = nearest(b, Infinity);
          if (n) {
            const dx = b.x - n.x, dy = b.y - n.y;
            const dd = Math.hypot(dx, dy) || 1;
            p = nudge(n.x + (dx / dd) * 120, n.y + (dy / dd) * 120, b.r);
          } else p = openSpot(b.r);
        } else p = openSpot(b.r);
        b.retarget = t + 3 + 5 * rand();
      }
      b.tx = p.x;
      b.ty = p.y;
    };

    // ---------- hops ----------
    const startHop = (b: Blob, dx: number, dy: number, power: number, opts: { ant?: number; ground?: boolean } = {}) => {
      if (b.hop && b.hop.phase !== "rec") return false;
      const ant = opts.ant ?? 2;
      b.hop = { phase: ant > 0 ? "ant" : "air", f: 0, frames: ant > 0 ? ant : Math.round(4 + 7 * power), dx, dy, power, ground: !!opts.ground };
      if (ant > 0) {
        b.qv += 3 * sqGain(b);
        if (dx || dy) { b.heading = Math.atan2(dy, dx); lookAt(b, { kind: "point", x: b.x + dx * 120, y: b.y + dy * 120 }, 1, 0.5); }
      } else launch(b);
      b.fatigue += 0.03 * (1 - 0.8 * b.c.P.jumpy) * (0.3 + 0.7 * b.c.napProne); // hoppers don't tire of hopping
      b.hold = 1;
      b.forceRender = true;
      return true;
    };
    const launch = (b: Blob) => {
      const h = b.hop!;
      const L = (300 + 400 * h.power) / Math.pow(b.c.mass, 0.3);
      b.vx += h.dx * L;
      b.vy += h.dy * L;
      b.qv -= 5 * sqGain(b);
      b.sv += 1.5 * sqGain(b);
      h.phase = "air";
      h.f = 0;
      h.frames = Math.round(4 + 7 * h.power);
      b.power = h.power;
    };
    const onLand = (b: Blob) => {
      const h = b.hop!;
      b.qv += (3 + 2 * h.power) * sqGain(b) * Math.min(2, Math.sqrt(b.c.mass)); // heavy ones thud
      const lvx = b.vx * (h.ground ? 0.05 : 0.25), lvy = b.vy * (h.ground ? 0.05 : 0.25);
      b.evx += lvx * 0.6;
      b.evy += lvy * 0.6;
      stumble(b, lvx, lvy, 0.12); // the landing skid is a step, not a slide
      b.shKick = 0.18;
      b.alt = 0;
      if (h.power > 0.6) eyeWide(b, 0.17);
      for (const o of blobs) {
        if (o === b || dist(o, b) > 260) continue;
        lookAt(o, { kind: "blob", blob: b }, 0.6, 0.5);
        if ((h.power > 0.7 || b.state === "thrown") && (o.state === "idle" || o.state === "wander") && rand() < (b.state === "thrown" ? 0.5 : 0.25)) {
          o.curiousT = { kind: "blob", blob: b };
          o.until = t + 0.1 + rand() * 0.2; // staggered
          o.nextThink = t;
          go(o, "curious");
        }
      }
    };
    // advance hop phases once per rendered frame
    const tickHop = (b: Blob) => {
      const h = b.hop;
      if (!h) return;
      h.f++;
      if (h.phase === "ant") {
        if (h.f >= h.frames) launch(b);
      } else if (h.phase === "air") {
        b.alt = h.ground ? 0 : Math.sin((Math.PI * (h.f - 0.5)) / h.frames);
        if (b.mouth && h.f === Math.round(h.frames / 2)) b.grinUntil = t + 0.25;
        if (h.f >= h.frames) { onLand(b); h.phase = "land"; h.f = 0; h.frames = 3; }
      } else if (h.phase === "land") {
        if (h.f >= h.frames) { h.phase = "rec"; h.f = 0; h.frames = 2; }
      } else if (h.f >= h.frames) {
        b.hop = null;
        b.hold = b.c.hold;
        if (b.hopQueue.length) {
          const p = b.hopQueue.shift()!;
          const dx = b.tx - b.x, dy = b.ty - b.y;
          const dd = Math.hypot(dx, dy) || 1;
          startHop(b, dx / dd, dy / dd, p);
        }
      }
    };

    // ---------- states ----------
    const go = (b: Blob, next: StateName, opts: { src?: { x: number; y: number }; power?: number; partner?: Blob; grudge?: Blob | null } = {}) => {
      if (b.state === "chase" && next !== "chase") endChase(b);
      if (b.state === "greet" && next !== "greet" && b.partner && b.partner.state === "greet" && b.partner.partner === b) {
        const p = b.partner;
        p.partner = null;
        eyeWide(p, 0.25);
        p.sv -= 1 * sqGain(p);
        go(p, "wander");
      }
      if (b.state === "nap") { b.napping = false; }
      b.prev = b.state;
      b.state = next;
      b.stateT = 0;
      b.forceRender = true;
      b.tremble = 0;
      b.squint = 0;
      b.hold = b.hop ? 1 : b.c.hold;
      b.boilMul = 1;
      switch (next) {
        case "idle":
          b.until = t + (6 - 4.5 * b.c.P.restless) * (0.6 + 0.8 * rand());
          b.hold = Math.max(b.hold, 2);
          b.boilMul = 0.7;
          b.nextThink = t + 0.3;
          break;
        case "wander":
          pickWaypoint(b);
          b.boilMul = 1.2;
          b.nextDash = t + 1 + 2 * rand();
          b.nextThink = t + 0.25;
          break;
        case "nap":
          b.until = t + 8 + 12 * rand();
          b.napping = true;
          b.hold = 2;
          b.boilMul = 0.4;
          b.blinkUntil = 0;
          break;
        case "curious":
          b.coolCurious = t + 5;
          b.eyeScale = 1.15;
          b.eyeScaleUntil = t + 4;
          b.hv += 0.8;
          showEmote(b, "q", 1.6);
          if (!b.curiousT) b.curiousT = { kind: "pointer" };
          if (b.until < t + 1) b.until = t + 1.5 + 2.5 * rand();
          break;
        case "startled": {
          const src = opts.src ?? { x: b.x, y: b.y };
          const power = opts.power ?? 0.9 * b.c.P.jumpy;
          b.coolStartle = t + 1.5;
          eyeWide(b, 0.25);
          showEmote(b, "bang", 0.9);
          lookAt(b, { kind: "point", x: src.x, y: src.y }, 1, 1.2);
          const dx = b.x - src.x, dy = b.y - src.y;
          const dd = Math.hypot(dx, dy) || 1;
          if (power >= 0.12) startHop(b, dx / dd, dy / dd, power, { ant: 1 });
          b.until = t + 0.9 + 0.7 * rand();
          b.boilMul = 2;
          chain(b);
          break;
        }
        case "chase":
          chaseActive = true;
          b.until = t + 3 + 4 * rand();
          break;
        case "greet":
          b.partner = opts.partner ?? b.partner;
          b.coolGreet = t + 8;
          b.greetPhase = 0;
          b.until = t + 1.2;
          if (b.partner) lookAt(b, { kind: "blob", blob: b.partner }, 1, 6);
          break;
        case "sulk": {
          b.grudge = opts.grudge ?? null;
          b.until = t + 3 + 5 * (1 - b.c.P.social);
          b.hold = 2;
          showEmote(b, "angry", 2.4);
          b.nextEmote = t + 4;
          b.boilMul = 0.5;
          b.squint = 0.55;
          const right = b.grudge ? b.grudge.x > b.x : rand() < 0.5;
          const p = nudge(right ? 0.1 * W + (rand() - 0.5) * 60 : 0.9 * W + (rand() - 0.5) * 60, b.r + rand() * (H - 2 * b.r), b.r);
          b.sulkX = p.x;
          b.sulkY = p.y;
          break;
        }
        case "celebrate":
          b.hopsLeft = 3 + Math.round(2 * rand());
          b.until = t + 2.6;
          b.eyeScale = 1.2;
          showEmote(b, "laugh", 2.4);
          b.eyeScaleUntil = t + 2.6;
          b.boilMul = 2;
          b.nextHopAt = t;
          for (const o of blobs) {
            if (o === b || o.c.P.social <= 0.5 || dist(o, b) > 200) continue;
            if ((o.state === "idle" || o.state === "wander") && rand() < 0.5) o.celebrateAt = t + 2 * FRAME;
          }
          break;
        case "grabbed":
          b.hop = null;
          b.stp = null;
          b.pending = null;
          b.alt = 1;
          b.eyeScale = 1.25;
          b.eyeScaleUntil = t + 60;
          b.hold = 1;
          b.power = 0.6; // how high it hangs while held
          b.boilMul = 2.2; // nervous outline while held
          showEmote(b, "bang", 0.5);
          if (b.c.name === "Loaf" && b.prev === "nap") { b.eyeScale = 1.35; b.eyeScaleUntil = t + 0.17; }
          for (const o of blobs) if (o.partner === b) { o.partner = null; if (o.state === "greet" || o.state === "chase") { eyeWide(o, 0.25); go(o, "idle"); } }
          break;
        case "thrown": {
          const sp = Math.hypot(b.vx, b.vy) || 1;
          const power = clamp(sp / 2400, 0, 1);
          b.hop = { phase: "air", f: 0, frames: Math.round(clamp(sp / 2400, 0.25, 0.8) / FRAME), dx: b.vx / sp, dy: b.vy / sp, power, ground: false };
          b.power = power;
          b.heading = Math.atan2(b.vy, b.vx);
          b.sv += 2 * sqGain(b);
          b.eyeScale = 1.35;
          b.eyeScaleUntil = t + 1;
          b.hv = (rand() < 0.5 ? -1 : 1) * 4;
          b.hold = 1;
          b.dizzy = false;
          break;
        }
      }
    };
    const endChase = (b: Blob) => {
      chaseActive = false;
      const p = b.partner;
      b.partner = null;
      b.role = null;
      if (p && p.partner === b) { p.partner = null; p.role = null; if (p.state === "chase") go(p, "idle"); }
    };
    const chain = (b: Blob) => {
      for (const o of blobs) {
        if (o === b || o.state === "startled" || o.coolStartle > t || dist(o, b) > 220) continue;
        const p = o.napping ? 0.5 : 0.1 + 0.7 * o.c.P.jumpy;
        if (rand() < p) {
          o.startleAt = t + (1 + Math.round(rand())) * FRAME;
          o.startleX = b.x;
          o.startleY = b.y;
          o.startlePower = 0.9 * o.c.P.jumpy;
        }
      }
    };
    /** Something alarming happened at (sx, sy). Jumpy blobs leap; calm ones just react. */
    const startle = (b: Blob, sx: number, sy: number, power: number) => {
      if (b.grabbed) return;
      if (b.c.P.jumpy < 0.15) {
        eyeWide(b, 0.17);
        lookAt(b, { kind: "point", x: sx, y: sy }, 1, 1);
        if (b.napping) {
          b.qv += 2 * sqGain(b);
          b.mood -= 0.2;
          b.fatigue = Math.max(0, b.fatigue - 0.3);
          go(b, "idle");
        } else {
          b.qv += 1.2 * sqGain(b);
        }
        return;
      }
      go(b, "startled", { src: { x: sx, y: sy }, power });
    };
    // A burst of lines at the point of contact, sized by how hard the hit was.
    const showImpact = (b: Blob, nx: number, ny: number, strength: number) => {
      b.impactBorn = t;
      b.impactX = b.d / 2 + nx * b.r;
      b.impactY = b.d / 2 + ny * b.r;
      b.impactAngle = Math.atan2(ny, nx) + (rand() - 0.5) * 1.2; // off the contact angle a bit
      b.impactSize = clamp(strength / 500, 0.5, 1.6) * (0.8 + rand() * 0.5);
      // a fresh shape and a fresh ink stack every hit
      const glyph = IMPACTS[Math.floor(rand() * IMPACTS.length)];
      const stack = IMPACT_INKS[Math.floor(rand() * IMPACT_INKS.length)];
      b.impactUnder.innerHTML = glyph;
      b.impactInk0.innerHTML = glyph;
      b.impactInk0.style.color = INKS[stack[0].ink];
      b.impactInk1.innerHTML = stack[1] ? glyph : "";
      b.impactInk1.style.color = stack[1] ? INKS[stack[1].ink] : "";
      b.impactInk1.style.opacity = stack[1] ? String(stack[1].a) : "0";
      b.forceRender = true;
    };
    const bump = (b: Blob, other: Blob, nx: number, ny: number, impact: number) => {
      showImpact(b, nx, ny, impact);
      // squash along the contact normal, anchored on the far side so the pushed side caves in
      b.ax = Math.atan2(ny, nx);
      b.axUntil = t + 0.45;
      b.anchorX = -nx * b.r * 0.9;
      b.anchorY = -ny * b.r * 0.9;
      // the light one takes most of the deformation
      const sq = (Math.min(0.45, impact / 700) * (0.7 + 0.6 * b.c.P.squishy)) / Math.sqrt(b.c.mass);
      b.s = Math.max(b.c.sClamp[0], Math.min(b.s, -sq));
      b.sv = -1.5 * sqGain(b);
      b.evx += nx * impact * 0.55;
      b.evy += ny * impact * 0.55;
      b.hv += (rand() - 0.5) * impact / 150;
      lookAt(b, { kind: "blob", blob: other }, 1, 0.8);
      b.mood -= (impact > 250 ? 0.12 : 0.04) * (1.2 - b.c.P.social);
      b.forceRender = true;
      if (b.state === "grabbed" || b.state === "thrown") return;
      if (b.napping) {
        if (impact > 80) { b.mood -= 0.4; startle(b, other.x, other.y, 0.8 * b.c.P.jumpy); }
        return;
      }
      const slower = Math.hypot(b.vx, b.vy) <= Math.hypot(other.vx, other.vy);
      if (impact > 250) {
        if (slower && rand() < (1 - b.c.P.social) * 0.7) go(b, "sulk", { grudge: other });
        else if (!slower && b.c.P.social > 0.6 && rand() < 0.5 && greetable(other) && greetable(b)) { go(b, "greet", { partner: other }); go(other, "greet", { partner: b }); b.initiator = true; other.initiator = false; }
        else eyeWide(b, 0.25);
      } else if (rand() < b.c.P.social * 0.5 && greetable(b) && greetable(other)) {
        go(b, "greet", { partner: other }); go(other, "greet", { partner: b }); b.initiator = true; other.initiator = false;
      } else eyeWide(b, 0.17);
      if (b.state === "sulk") { b.mood -= 0.3; b.until += 2; }
    };

    // ---------- per-tick ----------
    const pairs = (dt: number) => {
      for (let i = 0; i < blobs.length; i++) {
        if (blobs[i].bornAt > t) continue;
        for (let j = i + 1; j < blobs.length; j++) {
          if (blobs[j].bornAt > t) continue;
          const a = blobs[i], c = blobs[j];
          const dx = c.x - a.x, dy = c.y - a.y;
          const dd = Math.hypot(dx, dy) || 1;
          const minDist = a.r + c.r + 6 + (a.napping || c.napping ? 24 : 0);
          if (dd >= minDist) continue;
          const nx = dx / dd, ny = dy / dd;
          // positional separation, weighted by mass, so nobody slides: they just un-squish apart
          const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
          {
            const pen = minDist - dd;
            const ia = a.grabbed ? 0 : 1 / a.c.mass, ic = c.grabbed ? 0 : 1 / c.c.mass;
            const tot = ia + ic || 1;
            const k = Math.min(1, 30 * dt);
            a.x -= nx * pen * (ia / tot) * k; a.y -= ny * pen * (ia / tot) * k;
            c.x += nx * pen * (ic / tot) * k; c.y += ny * pen * (ic / tot) * k;
          }
          const key = `p${i}${j}`;
          const cool = pairCool[key] ?? 0;
          if (rv < -40 && t - cool > 0.35) {
            pairCool[key] = t;
            // inelastic: they squish into each other, then the heavy one shoves the light one
            const e = 0.15;
            const ma = a.grabbed ? 1e9 : a.c.mass, mc = c.grabbed ? 1e9 : c.c.mass;
            const J = (-(1 + e) * rv) / (1 / ma + 1 / mc);
            a.vx -= (nx * J) / ma; a.vy -= (ny * J) / ma;
            c.vx += (nx * J) / mc; c.vy += (ny * J) / mc;
            bump(a, c, nx, ny, -rv);
            bump(c, a, -nx, -ny, -rv);
            // squish together for a beat, then each stumbles back a step (flights keep their velocity)
            for (const b of [a, c]) {
              if (b.grabbed || (b.hop && b.hop.phase === "air") || b.state === "thrown") continue;
              b.stickUntil = t + 0.16;
              stumble(b, b.vx, b.vy, 0.16);
            }
          }
        }
      }
    };
    const pairCool: Record<string, number> = {};

    const think = (b: Blob) => {
      // shared checks for idle / wander (4 Hz)
      const P = b.c.P;
      if (pointer.known) {
        const pd = dist(b, pointer);
        const toward = ((b.x - pointer.x) * pointer.vx + (b.y - pointer.y) * pointer.vy) / (pd || 1);
        if (toward > 600 && pd < b.r + 160 && b.coolStartle < t && rand() < 0.3 + 0.6 * P.jumpy) { startle(b, pointer.x, pointer.y, 0.9 * P.jumpy); return true; }
        if (pd < b.r + 300 && pointer.speed < 40 && b.coolCurious < t && rand() < 0.06 * (0.4 + 0.6 * P.social)) { b.curiousT = { kind: "pointer" }; go(b, "curious"); return true; }
      }
      const n = nearest(b, 140);
      if (n && greetable(b) && greetable(n) && rand() < 0.2 * P.social * n.c.P.social) {
        go(b, "greet", { partner: n }); go(n, "greet", { partner: b }); b.initiator = true; n.initiator = false; return true;
      }
      if (b.c.shy && b.coolPuff < t) {
        const near = n && dist(b, n) < 130 ? n : null;
        const pnear = pointer.known && dist(b, pointer) < 150;
        if (near || pnear) {
          // bashful: a happy squint, a blush, a little bounce, then a sidestep
          b.coolPuff = t + 5;
          b.happyUntil = t + 1.4;
          b.qv += 1.5 * sqGain(b);
          lookAt(b, near ? { kind: "blob", blob: near } : { kind: "pointer" }, 1, 1.2);
          const sx = near ? near.x : pointer.x, sy = near ? near.y : pointer.y;
          const ax = b.x - sx, ay = b.y - sy;
          const ad = Math.hypot(ax, ay) || 1;
          const p = nudge(b.x + (ax / ad) * 150, b.y + (ay / ad) * 150, b.r);
          if (b.state === "idle") go(b, "wander");
          b.tx = p.x; b.ty = p.y; b.retarget = t + 3;
          b.forceRender = true;
          return true;
        }
      }
      return false;
    };

    const stepState = (b: Blob, dt: number) => {
      const P = b.c.P;
      b.sTarget = 0;
      b.qTarget = 0;
      switch (b.state) {
        case "idle": {
          b.qTarget = 0.03 * Math.sin(TAU * 0.4 * b.stateT + b.i);
          if (b.c.eyeJitter) b.tremble = 1;
          if (t > b.nextThink) {
            b.nextThink = t + 0.25;
            if (think(b)) return;
            const napP = (0.02 + 0.1 * b.fatigue * (1 - P.restless)) * (1 + 3 * b.c.napProne) * (pointer.known ? 1 : 2);
            if (b.fatigue > 0.35 + 0.6 * (1 - b.c.napProne) || rand() < napP * 0.25 * b.c.napProne * b.c.napProne) { go(b, "nap"); return; }
            if (b.mood > 0.6) { go(b, "celebrate"); return; }
            if (rand() < 0.4 && !b.gaze) {
              const r = rand();
              if (r < 0.3 && pointer.known) lookAt(b, { kind: "pointer" }, 0.8, 1.5);
              else if (r < 0.7) { const n = nearest(b, Infinity); if (n) lookAt(b, { kind: "blob", blob: n }, 0.7, 1.5); }
              else lookAt(b, { kind: "point", x: b.x + (rand() - 0.5) * 400, y: b.y + (rand() - 0.5) * 400 }, 0.5, 1);
            }
          }
          if (t > b.until) {
            const w = [
              ["wander", 6], ["hop", 1 + 5 * P.jumpy],
              ["chase", chaseActive ? 0 : 1.5 * P.social * P.restless],
              ["idle", 1],
            ] as const;
            let sum = 0; for (const [, v] of w) sum += v;
            let r = rand() * sum;
            for (const [name, v] of w) {
              r -= v;
              if (r <= 0) {
                if (name === "hop") { pickWaypoint(b); const dx = b.tx - b.x, dy = b.ty - b.y; const dd = Math.hypot(dx, dy) || 1; startHop(b, dx / dd, dy / dd, (0.3 + 0.5 * rand()) * (0.3 + 0.7 * P.jumpy)); go(b, "wander"); }
                else if (name === "chase") {
                  const target = blobs.find((o) => o !== b && o.state === "wander");
                  if (target) { b.partner = target; b.role = "chaser"; go(b, "chase"); if (rand() < 0.6 * target.c.P.social) { target.partner = b; target.role = "flee"; target.eyeScale = 1.2; target.eyeScaleUntil = t + 3; go(target, "chase"); target.until = b.until; } }
                  else go(b, "wander");
                } else go(b, name);
                break;
              }
            }
          }
          break;
        }
        case "wander": {
          const dx = b.tx - b.x, dy = b.ty - b.y;
          const dd = Math.hypot(dx, dy) || 1;
          if (dd < 30 || t > b.retarget) {
            if (rand() < 0.7 && b.c.gait !== "dart") { go(b, "idle"); return; }
            pickWaypoint(b);
          }
          const ux = dx / dd, uy = dy / dd;
          if (b.c.gait === "hoppy") {
            if (!b.hop && !b.hopQueue.length && t > b.nextHopAt) {
              b.nextHopAt = t + 0.75;
              if (rand() < 0.12) { startHop(b, ux, uy, 0.3); b.hopQueue = [0.35, 0.6]; }
              else startHop(b, ux, uy, 0.25);
            }
          } else if (b.c.gait === "dart") {
            // a zip: one long three-frame step with a big stretch, then a full stop
            b.tremble = !b.stp && t > b.nextDash - 0.15 ? 1 : 0; // a shiver of anticipation
            if (!b.stp && t > b.nextDash) {
              const back = b.dt2 === 1;
              const dxx = back ? -b.dashX : ux, dyy = back ? -b.dashY : uy;
              b.dashX = dxx; b.dashY = dyy;
              b.stepAt = 0;
              step(b, dxx, dyy, 90 + 70 * rand(), 0, { ant: 1, move: 3, land: 2, stretch: 2 });
              if (!back && rand() < 0.15) {
                // the double-take: freeze, look at you, bolt the other way
                b.dt2 = 1; b.nextDash = t + 0.45; eyeWide(b, 0.4); lookAt(b, { kind: "pointer" }, 1, 0.6);
              } else { b.dt2 = 0; b.nextDash = t + 1.2 + 2.5 * rand(); }
              b.tremble = 0;
            }
          } else {
            step(b, ux, uy, (16 + 26 * P.speed) * (b.c.gait === "drift" ? 0.5 : 1.2), 0.32 + 0.38 * (1 - P.speed));
          }
          if (!b.hop && b.c.gait !== "hoppy" && b.c.gait !== "dart" && rand() < (0.05 + 0.5 * P.jumpy) * dt) {
            const a = Math.atan2(uy, ux) + (rand() - 0.5) * 1;
            startHop(b, Math.cos(a), Math.sin(a), (0.3 + 0.5 * rand()) * (0.3 + 0.7 * P.jumpy));
          }
          if (b.c.name === "Pip" && pointer.known) b.dilate = dist(b, pointer) < 160;
          if (t > b.nextThink) {
            b.nextThink = t + 0.25;
            if (think(b)) return;
            if (b.fatigue > 0.6 + 0.4 * (1 - b.c.napProne) && rand() < 0.0125) { go(b, "nap"); return; }
          }
          break;
        }
        case "nap": {
          b.qTarget = 0.08 + 0.05 * Math.sin(TAU * 0.35 * b.stateT);
          b.fatigue = Math.max(0, b.fatigue - 0.08 * dt);
          // a hand-drawn Z drifts up every second or so
          if (t > b.nextZ && b.stateT > 0.6) {
            b.nextZ = t + 1 + 0.5 * rand();
            const z = b.zs.find((z) => t - z.born > Z_LIFE);
            if (z) {
              z.born = t;
              z.dx = (rand() - 0.5) * 0.5;
              z.rot = (rand() - 0.5) * 30;
              z.path.setAttribute("d", Z_PATHS[Math.floor(rand() * Z_PATHS.length)]);
            }
          }
          if (rand() < 0.1 * dt) { b.sv += 0.6 * sqGain(b); b.forceRender = true; }
          if (pointer.known && dist(b, pointer) < b.r + 60) { b.mood -= 0.4; startle(b, pointer.x, pointer.y, 0.8 * P.jumpy); return; }
          if (t > b.until) {
            b.napping = false;
            b.qv -= 2 * sqGain(b);
            b.blinkUntil = t + 0.17;
            b.secondBlinkAt = t + 0.45;
            b.mood += 0.1;
            go(b, "idle");
          }
          break;
        }
        case "curious": {
          const g = b.curiousT ?? { kind: "pointer" as const };
          const tp = gazePos(b, g);
          const dx = tp.x - b.x, dy = tp.y - b.y;
          const dd = Math.hypot(dx, dy) || 1;
          lookAt(b, g, 1, 0.5);
          b.heading = lerpAngle(b.heading, Math.atan2(dy, dx), 1 - Math.pow(0.002, dt));
          b.sTarget = 0.12;
          if (dd > b.r + 120) step(b, dx / dd, dy / dd, 12, 0.8);
          if (g.kind === "pointer") {
            if (pointer.speed > 600 && dd < b.r + 200) { startle(b, pointer.x, pointer.y, 0.9 * P.jumpy); return; }
            if (!pointer.known || dd > 450 || rand() < 0.2 * dt) { b.curiousT = null; go(b, "idle"); return; }
          } else if (dd > 350) { b.curiousT = null; go(b, "idle"); return; }
          if (t > b.until) {
            b.curiousT = null;
            if (rand() < 0.7 || P.social <= 0.5) go(b, "idle");
            else { go(b, "wander"); b.tx = tp.x + (rand() - 0.5) * 100; b.ty = tp.y + (rand() - 0.5) * 100; }
          }
          break;
        }
        case "startled": {
          if (b.hop) return;
          b.tremble = 1;
          b.qTarget = 0.05;
          if (t > b.until) {
            b.tremble = 0;
            if (b.mood < -0.3) go(b, "sulk", { grudge: null });
            else { go(b, "wander"); }
          }
          break;
        }
        case "chase": {
          const p = b.partner;
          if (!p) { go(b, "idle"); return; }
          if (b.role === "chaser") {
            const ax = p.x + p.vx * 0.3, ay = p.y + p.vy * 0.3;
            const dx = ax - b.x, dy = ay - b.y;
            const dd = Math.hypot(dx, dy) || 1;
            step(b, dx / dd, dy / dd, 40 * (0.6 + P.speed), 0.3);
            lookAt(b, { kind: "blob", blob: p }, 1, 0.3);
            if (!b.hop && rand() < 0.8 * P.jumpy * dt) startHop(b, dx / dd, dy / dd, 0.5);
            if (dd < b.r + p.r + 10) {
              if (p.role === "flee") { endChase(b); go(b, "celebrate"); go(p, "celebrate"); return; }
            }
          } else {
            const dx = b.x - p.x, dy = b.y - p.y;
            const dd = Math.hypot(dx, dy) || 1;
            const zig = Math.sin(TAU * 1.5 * b.stateT) * 60;
            const fx = (dx / dd) * 150 * (0.6 + P.speed) + (-dy / dd) * zig;
            const fy = (dy / dd) * 150 * (0.6 + P.speed) + (dx / dd) * zig;
            const fl = Math.hypot(fx, fy) || 1;
            step(b, fx / fl, fy / fl, Math.min(60, fl * 0.3), 0.3);
            lookAt(b, { kind: "blob", blob: p }, 0.8, 0.3);
            if (!b.hop && rand() < 0.6 * dt) { const a = Math.atan2(dy, dx) + (rand() - 0.5) * 0.9; startHop(b, Math.cos(a), Math.sin(a), 0.45); }
          }
          if (t > b.until) { endChase(b); go(b, "idle"); }
          break;
        }
        case "greet": {
          const p = b.partner;
          if (!p || p.partner !== b || dist(b, p) > 260) { b.partner = null; eyeWide(b, 0.25); b.sv -= 1 * sqGain(b); go(b, "wander"); return; }
          if (b.greetPhase === 0) {
            const dx = b.x - p.x, dy = b.y - p.y;
            const dd = Math.hypot(dx, dy) || 1;
            const gx = p.x + (dx / dd) * (b.r + p.r + 14), gy = p.y + (dy / dd) * (b.r + p.r + 14);
            const ex = gx - b.x, ey = gy - b.y;
            const ed = Math.hypot(ex, ey) || 1;
            step(b, ex / ed, ey / ed, Math.min(24, ed), 0.35);
            if (ed < 8 || t > b.until) { b.greetPhase = 1; b.until = t + 0.4; }
          } else if (b.greetPhase === 1) {
            b.heading = lerpAngle(b.heading, Math.atan2(p.y - b.y, p.x - b.x), 1 - Math.pow(0.002, dt));
            b.sTarget = 0.05;
            if (t > b.until) { b.greetPhase = 2; const first = P.social >= p.c.P.social; b.nextHopAt = first ? t : t + 3 * FRAME; b.hopsLeft = rand() < 0.3 ? 2 : 1; }
          } else if (b.greetPhase === 2) {
            if (t > b.nextHopAt && !b.hop && b.hopsLeft > 0) { startHop(b, 0, 0, 0.15); b.hopsLeft--; b.nextHopAt = t + 0.5; }
            if (b.hopsLeft === 0 && !b.hop) { b.greetPhase = 3; b.until = t + 0.6; b.mood += 0.2; showEmote(b, "heart", 1.3); }
          } else {
            b.qTarget = 0.03 * Math.sin(TAU * 0.8 * b.stateT);
            if (t > b.until && b.initiator) {
              const r = rand();
              if (r < 0.25 * P.social) { const pp = p; b.partner = null; pp.partner = null; go(b, "celebrate"); go(pp, "celebrate"); }
              else if (r < 0.25 * P.social + 0.3 && !chaseActive) {
                const chaser = P.speed >= p.c.P.speed ? b : p;
                const other = chaser === b ? p : b;
                chaser.role = "chaser"; other.role = rand() < 0.6 * other.c.P.social ? "flee" : null;
                chaser.partner = other; other.partner = chaser;
                go(chaser, "chase"); if (other.role === "flee") { go(other, "chase"); other.until = chaser.until; } else { go(other, "wander"); }
              } else {
                const a = rand() * TAU;
                const pp = p; b.partner = null; pp.partner = null;
                go(b, "wander"); b.tx = clamp(b.x + Math.cos(a) * 200, b.r, W - b.r); b.ty = clamp(b.y + Math.sin(a) * 200, b.r, H - b.r);
                go(pp, "wander"); pp.tx = clamp(pp.x - Math.cos(a) * 200, pp.r, W - pp.r); pp.ty = clamp(pp.y - Math.sin(a) * 200, pp.r, H - pp.r);
              }
            }
          }
          break;
        }
        case "sulk": {
          if (t > b.nextEmote) { b.nextEmote = t + 4 + 2 * rand(); showEmote(b, "angry", 2); }
          if (b.stateT < 1 && b.grudge) {
            const dx = b.x - b.grudge.x, dy = b.y - b.grudge.y;
            const dd = Math.hypot(dx, dy) || 1;
            b.vx += (dx / dd) * 90 * dt; b.vy += (dy / dd) * 90 * dt;
          } else {
            const dx = b.sulkX - b.x, dy = b.sulkY - b.y;
            const dd = Math.hypot(dx, dy);
            if (dd > 20) step(b, dx / dd, dy / dd, 16, 0.6);
            let cx = 0, cy = 0, n = 0;
            for (const o of blobs) if (o !== b) { cx += o.x; cy += o.y; n++; }
            if (n) {
              const ax = b.x - cx / n, ay = b.y - cy / n;
              const ad = Math.hypot(ax, ay) || 1;
              b.heading = lerpAngle(b.heading, Math.atan2(ay, ax), 1 - Math.pow(0.01, dt));
              lookAt(b, { kind: "point", x: b.x + (ax / ad) * 40, y: b.y + (ay / ad) * 40 + 30 }, 0.6, 0.3);
            }
          }
          b.squint = 0.55;
          b.qTarget = 0.06;
          b.mood += 0.3 * dt;
          const n = nearest(b, 120);
          if (n && n.state === "greet" && n.partner === b) {
            if (rand() < 0.5 * P.social) { b.mood += 0.4; b.squint = 0; b.initiator = false; go(b, "greet", { partner: n }); return; }
          }
          if (b.mood > -0.2 || t > b.until) { b.squint = 0; go(b, "idle"); }
          break;
        }
        case "celebrate": {
          if (!b.hop && b.hopsLeft > 0 && t > b.nextHopAt) {
            startHop(b, 0, 0, 0.25 + 0.15 * rand());
            if (b.c.nose !== null) b.heading += b.spin * 0.35; else b.tilt = b.spin * b.c.lean;
            b.spin = -b.spin;
            b.hopsLeft--;
            b.nextHopAt = t + 0.6;
          }
          b.blinkAt = Math.min(b.blinkAt, t + 0.7);
          if ((b.hopsLeft === 0 && !b.hop) || t > b.until) { b.mood -= 0.4; b.tilt = 0; go(b, "idle"); }
          break;
        }
        case "grabbed": {
          b.qTarget = -0.2;
          b.alt = 1;
          const sp = Math.hypot(b.vx, b.vy);
          lookAt(b, sp < 60 ? { kind: "point", x: b.x, y: b.y + 40 } : { kind: "point", x: b.x + b.vx, y: b.y + b.vy }, 1, 0.2);
          b.blinkAt = Math.min(b.blinkAt, t + 1);
          break;
        }
        case "thrown": {
          if (b.hop) return;
          if (!b.dizzy) { b.dizzy = true; b.hv = (rand() < 0.5 ? -1 : 1) * 6; b.evx += 120 * (rand() - 0.5); b.tremble = 1; b.until = t + 0.8; showEmote(b, "dizzy", 1.1); }
          if (t > b.until) {
            b.tremble = 0;
            b.mood -= 0.3;
            if (rand() < 0.4 * (1 - P.social)) go(b, "sulk", { grudge: null }); else go(b, "wander");
          }
          break;
        }
      }
    };

    const commonForces = (b: Blob, dt: number) => {
      const r = b.r;
      const P = b.c.P;
      const st = b.state;
      // pointer flinch
      if (pointer.known && !reduced && b.c.flinchReach > 0 && (st === "idle" || st === "wander") && !b.napping) {
        const dx = b.x - pointer.x, dy = b.y - pointer.y;
        const dd = Math.hypot(dx, dy) || 1;
        const reach = r + b.c.flinchReach;
        if (dd < reach) step(b, dx / dd, dy / dd, ((reach - dd) / reach) * 60 * b.c.flinchForce * (0.5 + P.jumpy), 0.25);
      }
      // keep off the text: ease the position out, no velocity, so it never slides
      const keep = hitKeep(b.x, b.y, r);
      if (keep) {
        const pl = b.x + r - keep.l, pr = keep.r - (b.x - r), pt = b.y + r - keep.t, pb = keep.b - (b.y - r);
        const m = Math.min(pl, pr, pt, pb);
        const k = Math.min(1, 6 * dt);
        if (m === pl) { b.x -= pl * k; if (b.vx > 0) b.vx = 0; }
        else if (m === pr) { b.x += pr * k; if (b.vx < 0) b.vx = 0; }
        else if (m === pt) { b.y -= pt * k; if (b.vy > 0) b.vy = 0; }
        else { b.y += pb * k; if (b.vy < 0) b.vy = 0; }
      }
      // edges (the visual box, not the hit radius): step away from them, never drift
      const hb = b.d / 2;
      if (!b.stp && !b.hop && (st === "idle" || st === "wander")) {
        const edge = 40;
        let ex = 0, ey = 0;
        if (b.x - hb < edge) ex = 1; else if (W - b.x - hb < edge) ex = -1;
        if (b.y - hb < edge) ey = 1; else if (H - b.y - hb < edge) ey = -1;
        if (ex || ey) { const l = Math.hypot(ex, ey); step(b, ex / l, ey / l, 24, 0.6); }
      }
      // only flights carry velocity; anything on the ground is frozen between steps
      const airborne = (b.hop && b.hop.phase === "air") || st === "thrown";
      const stepping = b.stp !== null && b.stp.phase === "move";
      if (!stepping) { const k = Math.pow(airborne ? 0.6 : 0.0005, dt); b.vx *= k; b.vy *= k; }
      // clamp
      if (!airborne && !stepping) {
        const vm = (st === "chase" ? 2 : 1) * vmax(b) * 1.6;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > vm) { b.vx *= vm / sp; b.vy *= vm / sp; }
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      // walls
      const bounce = b.c.bounce * 0.6;
      let impact = 0;
      let wx = b.x, wy = b.y;
      if (b.x < hb) { b.x = hb; impact = Math.abs(b.vx); b.vx = impact * bounce; wx = 0; }
      if (b.x > W - hb) { b.x = W - hb; impact = Math.abs(b.vx); b.vx = -impact * bounce; wx = W; }
      if (b.y < hb) { b.y = hb; impact = Math.abs(b.vy); b.vy = impact * bounce; wy = 0; }
      if (b.y > H - hb) { b.y = H - hb; impact = Math.abs(b.vy); b.vy = -impact * bounce; wy = H; }
      if (impact > 150) {
        const sq = (Math.min(0.45, impact / 900) * (0.7 + 0.6 * P.squishy)) / Math.sqrt(b.c.mass);
        // squash against the wall, anchored on the side away from it
        const wnx = wx === 0 ? -1 : wx === W ? 1 : 0, wny = wy === 0 ? -1 : wy === H ? 1 : 0;
        b.ax = Math.atan2(wny, wnx);
        b.axUntil = t + 0.4;
        b.anchorX = -wnx * b.r * 0.9;
        b.anchorY = -wny * b.r * 0.9;
        showImpact(b, wnx, wny, impact);
        b.s = Math.max(b.c.sClamp[0], Math.min(b.s, -sq));
        b.sv = -1.5 * sqGain(b);
        b.stickUntil = t + 0.15;
      }
      if (impact > 40 && !(b.hop && b.hop.phase === "air") && st !== "thrown") stumble(b, b.vx, b.vy, 0.15);
      if (impact > 300) { eyeWide(b, 0.25); lookAt(b, { kind: "point", x: wx, y: wy }, 1, 0.5); }
      if (impact > 500) {
        b.hv += (rand() < 0.5 ? -1 : 1) * impact / 60;
        if ((st === "wander" || st === "idle") && rand() < 0.4) { b.mood -= 0.1; startle(b, wx, wy, 0.3 * P.jumpy); }
      }
    };

    const springs = (b: Blob, dt: number) => {
      const [k, c] = b.c.spring;
      const speed = Math.hypot(b.vx, b.vy);
      const target = Math.min(0.5, speed / 900) + b.sTarget;
      b.sv += (k * (target - b.s) - c * b.sv) * dt;
      b.s += b.sv * dt;
      b.s = clamp(b.s, b.c.sClamp[0], b.c.sClamp[1]);
      b.qv += (260 * (b.qTarget - b.q) - c * b.qv) * dt;
      b.q += b.qv * dt;
      b.q = clamp(b.q, -0.35, 0.45);
      if (speed > 15 && !b.grabbed) {
        const h = Math.atan2(b.vy, b.vx);
        b.heading = lerpAngle(b.heading, h, 1 - Math.pow(0.0005, dt * b.c.headingRate));
      }
      if (b.c.nose === null) b.hv = 0; // upright bodies never tumble
      b.heading += b.hv * dt;
      b.hv *= Math.pow(0.02, dt);
      // the squash axis follows the heading unless a push is holding it
      if (t > b.axUntil) { b.ax = b.heading; b.anchorX = 0; b.anchorY = 0; }
      // lean for upright bodies
      if (b.c.nose === null) {
        const targetTilt = clamp(b.vx / (vmax(b) * 2), -1, 1) * b.c.lean;
        b.tilt += (targetTilt - b.tilt) * (1 - Math.pow(0.01, dt));
      }
      const [ek, ec] = b.c.eyeSpring;
      b.evx += (ek * (b.x - b.ex) - ec * b.evx) * dt;
      b.evy += (ek * (b.y - b.ey) - ec * b.evy) * dt;
      b.ex += b.evx * dt;
      b.ey += b.evy * dt;
      if (b.gaze && t > b.gazeUntil) { b.gazeW -= dt / 0.4; if (b.gazeW <= 0) { b.gaze = null; b.gazeW = 0; } }
      if (b.eyeScale !== 1 && t > b.eyeScaleUntil) { b.eyeScale = 1; b.forceRender = true; }
      // blink
      if (t > b.blinkAt) {
        const [mn, mx] = b.c.blink;
        b.blinkUntil = t + b.c.blinkDur / 1000;
        b.winking = b.c.winkP > 0 && rand() < b.c.winkP;
        b.blinkAt = t + (mn + rand() * (mx - mn)) / 1000;
        if (b.c.doubleP > 0 && rand() < b.c.doubleP) b.secondBlinkAt = t + b.c.blinkDur / 1000 + 0.12;
        b.forceRender = true;
      }
      if (b.secondBlinkAt && t > b.secondBlinkAt) { b.secondBlinkAt = 0; b.blinkUntil = t + b.c.blinkDur / 1000; b.forceRender = true; }
      b.mood += (0 - b.mood) * Math.min(1, (b.state === "sulk" ? 0.35 : 0.25) * dt);
      if (!b.napping) { b.fatigue = clamp(b.fatigue + (speed * dt) / 20000 - 0.02 * dt, 0, 1); }
      b.shKick *= Math.pow(0.002, dt);
    };

    // ---------- render ----------
    const set = (b: Blob, key: string, el: { style: CSSStyleDeclaration } | null, prop: string, value: string) => {
      if (!el || b.last[key] === value) return;
      b.last[key] = value;
      (el.style as unknown as Record<string, string>)[prop] = value;
    };
    let frame = 0;
    const render = () => {
      frame++;
      for (const b of blobs) {
        if (b.stp) tickStep(b);
        if (b.hop) tickHop(b);
        const life = t - b.bornAt;
        if (life < 0.75) b.forceRender = true; // every frame of the birth pop is a pose
        if (!b.forceRender && frame % b.hold !== 0) continue;
        b.forceRender = false;
        const c = b.c;
        const half = b.d / 2;
        // birth: a dot, a fat overshoot, a dip, a settle (scaled in place, from the feet up)
        const BORN = [0.2, 0.55, 1.35, 0.8, 1.12, 0.94, 1.03, 1];
        const born = life < 0 ? 0 : life < 0.7 ? BORN[Math.min(BORN.length - 1, Math.floor(life * 12))] : 1;
        const tr = b.tremble && !reduced ? Math.round((rand() - 0.5) * 2) : 0;
        set(b, "el", b.el, "transform", `translate3d(${Math.round(b.x - half + tr)}px, ${Math.round(b.y - half + tr)}px, 0)`);

        const alt = b.alt;
        const P = 1 + 0.06 * alt + 0.18 * alt * b.power;
        const lift = Math.round(alt * (8 + 12 * b.power));
        set(b, "pop", b.pop, "transform", `translateY(${-lift}px) scale(${q(P * born * (1 + b.q), 0.02)}, ${q(P * born * (1 - 0.8 * b.q), 0.02)})`);

        const sh = (1 - 0.45 * alt) * (1 + 0.3 * Math.max(0, b.s)) + b.shKick;
        set(b, "sh", b.shadow, "transform", `scaleX(${q(sh * born, 0.05)}) scaleY(${q((1 - 0.3 * alt) * born, 0.05)})`);
        set(b, "sho", b.shadow, "opacity", alt > 0.5 ? "0.3" : "1");

        const sx = 1 + b.s, sy = 1 - 0.6 * b.s;
        const h = q5deg(b.heading);
        const ax = q5deg(b.ax);
        const rot = c.nose !== null ? h - c.nose : q5deg(b.tilt);
        const faceRot = rot;
        // stretch/squash along `ax`; after a push it is anchored on the far side so the pushed side caves in
        const squash = `rotate(${ax.toFixed(3)}rad) scale(${q(sx, 0.04)}, ${q(sy, 0.04)}) rotate(${(-ax).toFixed(3)}rad)`;
        const bodyT = b.anchorX || b.anchorY
          ? `translate(${b.anchorX.toFixed(1)}px, ${b.anchorY.toFixed(1)}px) ${squash} translate(${(-b.anchorX).toFixed(1)}px, ${(-b.anchorY).toFixed(1)}px) rotate(${rot.toFixed(3)}rad)`
          : `${squash} rotate(${rot.toFixed(3)}rad)`;
        set(b, "body", b.body, "transform", bodyT);

        // outline boil
        if ((!reduced && frame % 2 === 0) || !b.last.d) {
          const jitter = reduced ? 0 : c.boil * b.boilMul;
          const d = roundedPolygon(c.verts, c.radius, jitter, rand);
          if (b.last.d !== d) { b.last.d = d; for (const p of b.paths) p.setAttribute("d", d); }
        }

        // eyes: lag + gaze
        let ox = b.ex - b.x, oy = b.ey - b.y;
        const maxLag = b.d * 0.12;
        const lag = Math.hypot(ox, oy);
        if (lag > maxLag) { ox *= maxLag / lag; oy *= maxLag / lag; }
        let gx = 0, gy = 0;
        let gw = 0;
        let gp: { x: number; y: number } | null = null;
        if (b.gaze && b.gazeW > 0) { gp = gazePos(b, b.gaze); gw = b.gazeW; }
        else if (c.gazeHeading && Math.hypot(b.vx, b.vy) > 20) { gp = { x: b.x + b.vx, y: b.y + b.vy }; gw = 1; }
        else if (pointer.known) { gp = { x: pointer.x, y: pointer.y }; gw = 1; }
        if (gp) {
          const dx = gp.x - b.x, dy = gp.y - b.y;
          const dd = Math.hypot(dx, dy) || 1;
          const reach = b.d * 0.07 * c.gaze * Math.max(0, gw);
          gx = (dx / dd) * reach; gy = (dy / dd) * reach;
        }
        const jx = c.eyeJitter && b.tremble && !reduced ? Math.round((rand() - 0.5) * 2) : 0;
        set(b, "face", b.face, "transform", `translate(${Math.round(ox + jx)}px, ${Math.round(oy)}px) rotate(${faceRot.toFixed(3)}rad)`);
        // pupils look around inside the whites
        b.pupils.forEach((g, k) => {
          const pr = b.pupilRange[k];
          const px = clamp((gx / b.scale) * 0.6, -pr, pr), py = clamp((gy / b.scale) * 0.6, -pr, pr);
          set(b, `pup${k}`, g, "transform", `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)${b.dilate ? " scale(1.25)" : ""}`);
        });
        // lids: 0 open .. 0.75 shut. Resting droop per character, bored droop when idle, wide when surprised.
        const blinking = t < b.blinkUntil;
        const happy = t < b.happyUntil;
        let lid = c.eyes.lidRest;
        if (b.state === "idle") lid = Math.max(lid, Math.min(0.3, (b.stateT - 3) * 0.05));
        const alert = b.hovered && (b.state === "idle" || b.state === "wander");
        if (alert) lid = 0;
        const laughing = b.state === "celebrate";
        const angry = b.state === "sulk";
        if (b.state === "nap") lid = 0.75;
        else if (angry) lid = 0.5;
        if (b.eyeScale > 1.05) lid = 0;
        if (blinking && !b.winking) lid = 0.75;
        lid = Math.round(lid * 8) / 8; // posed, not eased
        b.lids.forEach((l, k) => {
          const amt = blinking && b.winking && k === 1 ? 0.75 : lid;
          set(b, `lid${k}`, l.el, "transform", `translate(0px, ${((amt - 1) * l.span).toFixed(1)}px)`);
        });
        // lower lids rise for a happy ^ ^ (laughing, bashful)
        const lo = laughing || happy ? 0.6 : 0;
        b.lidlos.forEach((l, k) => set(b, `lidlo${k}`, l.el, "transform", `translate(0px, ${((1 - lo) * l.span).toFixed(1)}px)`));
        // brows: angry V, sad, raised, or one cocked
        const browMode = angry ? "angry" : b.state === "thrown" && b.dizzy ? "sad" : b.state === "startled" || b.state === "grabbed" || laughing || b.eyeScale > 1.2 ? "up" : b.state === "curious" ? "quiz" : "";
        set(b, "browsG", b.browsG, "opacity", browMode ? "1" : "0");
        const browT = (k: number) => {
          const sgn = k === 0 ? 1 : -1;
          if (browMode === "angry") return `translate(0px, 2px) rotate(${sgn * 22}deg)`;
          if (browMode === "sad") return `translate(0px, 1px) rotate(${-sgn * 18}deg)`;
          if (browMode === "up") return "translate(0px, -4px)";
          if (browMode === "quiz") return k === 0 ? "translate(0px, -5px)" : "rotate(-10deg)";
          return "none";
        };
        b.brows.forEach((el, k) => set(b, `brow${k}`, el, "transform", browT(k)));
        set(b, "cheeks", b.cheeks, "transform", happy ? "scale(1.35)" : "none");
        const es = alert && b.eyeScale === 1 ? 1.12 : b.eyeScale; // perks up under the cursor
        set(b, "eyes", b.eyesG, "transform", es === 1 ? "none" : `scale(${q(es, 0.05)})`);
        // mouth: opens wide for a laugh, flips to a frown when sulking
        set(b, "mouth", b.mouth, "transform", laughing ? "scale(1.4)" : angry ? "scale(1, -1)" : t < b.grinUntil ? "scaleX(1.2)" : "none");
        // cartoon mark above the head: pops in, jiggles, fades out, all in posed frames
        {
          const age = t - b.emoteBorn;
          if (age > b.emoteDur) set(b, "emo", b.emote, "opacity", "0");
          else {
            const f = Math.floor(age * 12);
            const left = b.emoteDur - age;
            // pop in with an overshoot, settle, jiggle, then shrink away
            const POP = [0.2, 1.35, 0.85, 1.1, 0.96, 1];
            let sc = (f < POP.length ? POP[f] : 1) * (b.emoteKind === "pop" ? 1.7 : 1);
            let rot = f < 2 ? -10 : f === 2 ? 6 : f % 4 < 2 ? 3 : -3;
            if (left < 0.3) { sc = left < 0.1 ? 0.4 : left < 0.2 ? 0.7 : 0.9; rot = 0; }
            const op = left < 0.1 ? 0.5 : 1;
            // top corner of the character, leaning away from it
            const burst = b.emoteKind === "pop"; // the birth burst sits on the body, not the corner
            const x = burst ? b.d * 0.25 : b.d * 0.62;
            const y = burst ? b.d * 0.31 : b.d * 0.1 - b.d * 0.3;
            set(b, "emo", b.emote, "opacity", String(op));
            set(b, "emot", b.emote, "transform", `translate(${Math.round(x)}px, ${Math.round(y)}px) rotate(${rot + 8}deg) scale(${sc})`);
          }
        }
        // impact burst at the contact point: flashes big, then shrinks away
        {
          const age = t - b.impactBorn;
          if (age > 0.4) set(b, "imp", b.impact, "opacity", "0");
          else {
            const f = Math.floor(age * 12);
            const HIT = [0.5, 1.35, 1.1, 0.85, 0.55];
            const sc = (HIT[Math.min(f, HIT.length - 1)] * b.impactSize).toFixed(2);
            const w = b.d * 0.55;
            set(b, "imp", b.impact, "opacity", f >= 4 ? "0.5" : "1");
            set(b, "impt", b.impact, "transform", `translate(${Math.round(b.impactX - w / 2)}px, ${Math.round(b.impactY - w / 2)}px) rotate(${(b.impactAngle * 180 / Math.PI).toFixed(0)}deg) scale(${sc})`);
          }
        }
        // sleep Z's: float up from the head in stop-motion steps, growing and fading
        b.zs.forEach((z, k) => {
          const age = t - z.born;
          if (age > Z_LIFE) { set(b, `z${k}`, z.el, "opacity", "0"); return; }
          const p = Math.floor((age / Z_LIFE) * 14) / 14;
          const x = b.d * 0.62 + z.dx * b.d * p + Math.sin(p * 7) * b.d * 0.05;
          const y = b.d * (c.bottom / 100 - 0.95) - p * b.d * 0.8;
          const sc = 0.55 + 0.6 * p;
          const op = p < 0.55 ? 1 : Math.round((1 - (p - 0.55) / 0.45) * 4) / 4;
          set(b, `z${k}`, z.el, "opacity", String(op));
          set(b, `zt${k}`, z.el, "transform", `translate(${Math.round(x)}px, ${Math.round(y)}px) rotate(${z.rot.toFixed(0)}deg) scale(${sc.toFixed(2)})`);
        });
      }
    };

    // ---------- loop ----------
    let last = performance.now();
    let acc = 0;
    let raf = 0;
    const tick = (dt: number) => {
      t += dt;
      if (pointer.expire && t > pointer.expire) { pointer.known = false; pointer.expire = 0; }
      if (!reduced) pairs(dt);
      for (const b of blobs) {
        // not born yet: sit invisible and inert until it pops in
        if (t < b.bornAt) continue;
        if (!b.popped) { b.popped = true; b.el.style.pointerEvents = ""; showEmote(b, "pop", 0.45); b.qv -= 3 * sqGain(b); b.forceRender = true; }
        if (b.grabbed) {
          const tx = pointer.x - b.gx, ty = pointer.y - b.gy;
          b.vx = (tx - b.x) / dt; b.vy = (ty - b.y) / dt;
          b.x = tx; b.y = ty;
          b.hist.push({ x: b.x, y: b.y, t });
          if (b.hist.length > 12) b.hist.shift();
          b.stateT += dt;
          stepState(b, dt);
          springs(b, dt);
          continue;
        }
        if (b.pending && t >= b.pending.at) {
          const p = b.pending;
          b.pending = null;
          if (!b.hop && b.state !== "thrown") { b.stp = null; b.stepAt = 0; step(b, p.dx, p.dy, p.len, 0.12, { ant: 0, move: 2, land: 2, stretch: 0.6 }); }
        }
        if (b.startleAt && t >= b.startleAt) { b.startleAt = 0; startle(b, b.startleX, b.startleY, b.startlePower); }
        if (b.celebrateAt && t >= b.celebrateAt) { b.celebrateAt = 0; if (b.state === "idle" || b.state === "wander") go(b, "celebrate"); }
        b.stateT += dt;
        if (reduced) {
          // calm: breathe, blink, look around; nothing moves
          b.sTarget = 0; b.qTarget = 0.03 * Math.sin(TAU * 0.4 * b.stateT + b.i);
          springs(b, dt);
          continue;
        }
        stepState(b, dt);
        commonForces(b, dt);
        springs(b, dt);
      }
      acc += dt;
      if (acc >= FRAME) { acc = Math.min(acc - FRAME, FRAME); render(); }
    };
    const loop = (now: number) => {
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;
      tick(dt);
      raf = requestAnimationFrame(loop);
    };
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else { last = performance.now(); raf = requestAnimationFrame(loop); }
    };
    document.addEventListener("visibilitychange", onVis);
    if (process.env.NODE_ENV === "development") {
      // dev hooks: inspect the cast and advance the simulation by hand
      const w = window as unknown as {
        __blobs: Blob[];
        __blobTick: (dt: number, n: number) => void;
        __blobGo: (i: number, s: StateName, opts?: Parameters<typeof go>[2]) => void;
      };
      w.__blobs = blobs;
      w.__blobTick = (dt, n) => { for (let i = 0; i < n; i++) tick(dt); };
      w.__blobGo = (i, s, opts) => go(blobs[i], s, opts);
    }
    render();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", releaseAll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={rootRef} className="blobs" aria-hidden="true">
      {CAST.map((c) => (
        <div key={c.name} className="blob" data-name={c.name} style={{ pointerEvents: "none" }}>
          <div className="blob-shadow" style={{ transform: "scale(0)" }} />
          <div className="blob-pop" style={{ transform: "scale(0)" }}>
            <svg className="blob-body" viewBox="0 0 100 100" overflow="visible">
              <g>
                <path className="ink" />
                <path className="ink2" />
              </g>
            </svg>
            <svg className="blob-face" viewBox="0 0 100 100" overflow="visible" />
          </div>
          <svg className="blob-impact" viewBox="0 0 40 40" overflow="visible">
            <g className="under" />
            <g className="ink0" />
            <g className="ink1" />
          </svg>
          <svg className="blob-emote" viewBox="0 0 40 30" overflow="visible">
            <g className="under" />
            <g className="over" />
            <g className="ink1" />
          </svg>
          <div className="blob-zs">
            {[0, 1, 2].map((k) => (
              <svg key={k} className="blob-z" viewBox="0 0 20 20" overflow="visible">
                <path d={Z_PATHS[k]} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
