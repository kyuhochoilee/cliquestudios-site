"use client";

import { useEffect, useRef } from "react";
import { CAST, roundedPolygon, type Char } from "./cast";

/**
 * Five ink creatures on a sheet of paper. Physics and a small state machine
 * run every frame; the DOM is written 12 times a second so the motion reads
 * like stop motion. See cast.ts for who they are.
 */

const FPS = 12;
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
  pupilsG: SVGGElement | null;
  wink: SVGElement | null;
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
  dashing: boolean; dashUntil: number; nextDash: number; dashX: number; dashY: number; dashSp: number; dt2: number; dtUntil: number;
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
    const content = document.querySelector<HTMLElement>(".content");

    // ---------- world ----------
    let W = 0;
    let H = 0;
    let keep = { l: 0, t: 0, r: 0, b: 0 };
    const measure = () => {
      const rr = root.getBoundingClientRect();
      W = rr.width;
      H = rr.height;
      if (content) {
        const c = content.getBoundingClientRect();
        const m = 18;
        keep = { l: c.left - rr.left - m, t: c.top - rr.top - m, r: c.right - rr.left + m, b: c.bottom - rr.top + m };
      }
    };
    measure();

    const pointer = { x: -9999, y: -9999, known: false, vx: 0, vy: 0, speed: 0, lastT: 0, expire: 0 };
    let t = 0; // simulation seconds
    let chaseActive = false;

    const inKeep = (x: number, y: number, r: number) =>
      x + r > keep.l && x - r < keep.r && y + r > keep.t && y - r < keep.b;

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
      if (!inKeep(x, y, r)) return { x, y };
      const pl = x + r - keep.l, pr = keep.r - (x - r), pt = y + r - keep.t, pb = keep.b - (y - r);
      const m = Math.min(pl, pr, pt, pb);
      if (m === pl) x -= pl + 10; else if (m === pr) x += pr + 10; else if (m === pt) y -= pt + 10; else y += pb + 10;
      return { x: clamp(x, r, W - r), y: clamp(y, r, H - r) };
    };

    // ---------- build ----------
    const blobs: Blob[] = [];
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
      body.style.setProperty("--ink", c.ink);
      body.style.setProperty("--falloff", `${c.falloff}deg`);
      body.classList.add(c.ink2 ? "tex-light" : "tex-dark");
      const paths = Array.from(body.querySelectorAll<SVGPathElement>("path"));
      if (c.ink2 && paths[1]) {
        paths[1].style.fill = c.ink2;
        paths[1].style.opacity = String(c.ink2Alpha);
        paths[1].style.transform = `translate(${(1.8 / scale).toFixed(2)}px, ${(0.8 / scale).toFixed(2)}px)`;
      } else if (paths[1]) {
        paths[1].remove();
        paths.length = 1;
      }
      const g = body.querySelector("g");
      if (g) g.setAttribute("filter", d < 65 ? "url(#riso-edge-sm)" : "url(#riso-edge)");
      face.innerHTML = c.face;
      const r = (d * c.fill) / 2;
      const spot = openSpot(r);
      const way = openSpot(r);
      const b: Blob = {
        c, i, el, body, paths, face,
        shadow: el.querySelector<HTMLDivElement>(".blob-shadow")!,
        pop: el.querySelector<HTMLDivElement>(".blob-pop")!,
        eyesG: face.querySelector<SVGGElement>(".eyes"),
        pupilsG: face.querySelector<SVGGElement>(".pupils"),
        wink: face.querySelector<SVGElement>(".wink"),
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
        dashing: false, dashUntil: 0, nextDash: 1 + rand(), dashX: 1, dashY: 0, dashSp: 0, dt2: 0, dtUntil: 0,
        hopQueue: [], sulkX: 0, sulkY: 0, dizzy: false, stepAt: 0, stickUntil: 0,
        grabbed: false, gx: 0, gy: 0, hist: [],
        forceRender: true,
        last: {},
      };
      blobs.push(b);
      b.pop.style.transformOrigin = `50% ${c.bottom}%`;
      b.shadow.style.top = `${c.bottom - 8}%`;

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
        el.classList.add("is-grabbed");
        go(b, "grabbed");
      });
      const release = (e: PointerEvent) => {
        if (!b.grabbed) return;
        b.grabbed = false;
        el.classList.remove("is-grabbed");
        if (e.pointerType === "touch") pointer.expire = t + 0.8;
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
        else { b.qv += 1.5 * sqGain(b); b.shKick = 0.12; go(b, "idle"); b.until = t + 1; }
      };
      el.addEventListener("pointerup", release);
      el.addEventListener("pointercancel", release);
    });

    const onMove = (e: PointerEvent) => {
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
    const step = (b: Blob, ux: number, uy: number, strength: number, interval: number) => {
      if (t < b.stepAt) return;
      b.stepAt = t + interval;
      const m = Math.pow(b.c.mass, 0.35); // heavy ones lumber
      b.vx += (ux * strength * 1.35) / m;
      b.vy += (uy * strength * 1.35) / m;
      b.qv -= 1.4 * sqGain(b);
      b.forceRender = true;
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
      b.hop = { phase: ant > 0 ? "ant" : "air", f: 0, frames: ant > 0 ? ant : Math.round(3 + 4 * power), dx, dy, power, ground: !!opts.ground };
      if (ant > 0) {
        b.qv += 3 * sqGain(b);
        if (dx || dy) { b.heading = Math.atan2(dy, dx); lookAt(b, { kind: "point", x: b.x + dx * 120, y: b.y + dy * 120 }, 1, 0.5); }
      } else launch(b);
      b.fatigue += 0.03;
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
      h.frames = Math.round(3 + 4 * h.power);
      b.power = h.power;
    };
    const onLand = (b: Blob) => {
      const h = b.hop!;
      b.qv += (3 + 2 * h.power) * sqGain(b) * Math.min(2, Math.sqrt(b.c.mass)); // heavy ones thud
      b.vx *= h.ground ? 0.05 : 0.2;
      b.vy *= h.ground ? 0.05 : 0.2;
      b.evx += b.vx * 0.4;
      b.evy += b.vy * 0.4;
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
        if (h.f >= h.frames) { onLand(b); h.phase = "land"; h.f = 0; h.frames = 2; }
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
          b.dashing = false;
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
          if (!b.curiousT) b.curiousT = { kind: "pointer" };
          if (b.until < t + 1) b.until = t + 1.5 + 2.5 * rand();
          break;
        case "startled": {
          const src = opts.src ?? { x: b.x, y: b.y };
          const power = opts.power ?? 0.9 * b.c.P.jumpy;
          b.coolStartle = t + 1.5;
          eyeWide(b, 0.25);
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
          b.alt = 1;
          b.eyeScale = 1.25;
          b.eyeScaleUntil = t + 60;
          b.hold = 1;
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
    const bump = (b: Blob, other: Blob, nx: number, ny: number, impact: number) => {
      b.heading = Math.atan2(ny, nx);
      // squash along the contact normal; the light one takes most of the deformation
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
        for (let j = i + 1; j < blobs.length; j++) {
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
            const k = Math.min(1, 9 * dt);
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
            if (!a.grabbed) a.stickUntil = t + 0.22;
            if (!c.grabbed) c.stickUntil = t + 0.22;
            bump(a, c, nx, ny, -rv);
            bump(c, a, -nx, -ny, -rv);
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
            if (b.fatigue > 0.35 || rand() < napP * 0.25 * (b.c.napProne + 0.05)) { go(b, "nap"); return; }
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
            if (!b.dashing) {
              b.tremble = t > b.nextDash - 0.15 ? 1 : 0; // a shiver of anticipation
              if (t > b.nextDash) {
                b.dashing = true;
                b.dashUntil = t + 0.2 + 0.1 * rand();
                b.dashSp = 450 + 250 * rand();
                b.dashX = ux; b.dashY = uy;
                b.vx = ux * b.dashSp; b.vy = uy * b.dashSp;
                b.heading = Math.atan2(uy, ux);
                b.sv += 2.5;
                b.dt2 = rand() < 0.15 ? 1 : 0;
                b.tremble = 0;
                b.forceRender = true;
              }
            } else {
              if (b.dt2 === 1 && t > b.dashUntil - 0.1) {
                b.dt2 = 2; b.dtUntil = t + 2 * FRAME;
                b.vx = 0; b.vy = 0;
                eyeWide(b, 0.2);
                lookAt(b, { kind: "pointer" }, 1, 0.5);
              } else if (b.dt2 === 2 && t > b.dtUntil) {
                b.dt2 = 0;
                b.vx = -b.dashX * b.dashSp; b.vy = -b.dashY * b.dashSp;
                b.heading = Math.atan2(-b.dashY, -b.dashX);
                b.dashUntil = t + 0.25;
              } else if (t > b.dashUntil) {
                b.dashing = false;
                b.vx *= 0.05; b.vy *= 0.05;
                b.sv -= 1.5;
                b.nextDash = t + 1.2 + 2.5 * rand();
                b.forceRender = true;
              }
            }
          } else {
            step(b, ux, uy, (70 + 110 * P.speed) * (b.c.gait === "drift" ? 0.5 : 1.2), 0.45 + 0.45 * (1 - P.speed));
          }
          if (!b.hop && b.c.gait !== "hoppy" && b.c.gait !== "dart" && rand() < (0.05 + 0.5 * P.jumpy) * dt) {
            const a = Math.atan2(uy, ux) + (rand() - 0.5) * 1;
            startHop(b, Math.cos(a), Math.sin(a), (0.3 + 0.5 * rand()) * (0.3 + 0.7 * P.jumpy));
          }
          if (b.c.name === "Pip" && pointer.known) b.dilate = dist(b, pointer) < 160;
          if (t > b.nextThink) {
            b.nextThink = t + 0.25;
            if (think(b)) return;
            if (b.fatigue > 0.6 && rand() < 0.0125) { go(b, "nap"); return; }
          }
          break;
        }
        case "nap": {
          b.qTarget = 0.08 + 0.05 * Math.sin(TAU * 0.35 * b.stateT);
          b.fatigue = Math.max(0, b.fatigue - 0.08 * dt);
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
          if (dd > b.r + 120) step(b, dx / dd, dy / dd, 45, 0.8);
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
            step(b, dx / dd, dy / dd, 150 * (0.6 + P.speed), 0.3);
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
            step(b, fx / fl, fy / fl, fl, 0.3);
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
            step(b, ex / ed, ey / ed, 90, 0.35);
            if (ed < 8 || t > b.until) { b.greetPhase = 1; b.until = t + 0.4; }
          } else if (b.greetPhase === 1) {
            b.heading = lerpAngle(b.heading, Math.atan2(p.y - b.y, p.x - b.x), 1 - Math.pow(0.002, dt));
            b.sTarget = 0.05;
            if (t > b.until) { b.greetPhase = 2; const first = P.social >= p.c.P.social; b.nextHopAt = first ? t : t + 3 * FRAME; b.hopsLeft = rand() < 0.3 ? 2 : 1; }
          } else if (b.greetPhase === 2) {
            if (t > b.nextHopAt && !b.hop && b.hopsLeft > 0) { startHop(b, 0, 0, 0.15); b.hopsLeft--; b.nextHopAt = t + 0.5; }
            if (b.hopsLeft === 0 && !b.hop) { b.greetPhase = 3; b.until = t + 0.6; b.mood += 0.2; }
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
          if (b.stateT < 1 && b.grudge) {
            const dx = b.x - b.grudge.x, dy = b.y - b.grudge.y;
            const dd = Math.hypot(dx, dy) || 1;
            b.vx += (dx / dd) * 90 * dt; b.vy += (dy / dd) * 90 * dt;
          } else {
            const dx = b.sulkX - b.x, dy = b.sulkY - b.y;
            const dd = Math.hypot(dx, dy);
            if (dd > 20) step(b, dx / dd, dy / dd, 55, 0.6);
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
          if (!b.dizzy) { b.dizzy = true; b.hv = (rand() < 0.5 ? -1 : 1) * 6; b.evx += 120 * (rand() - 0.5); b.tremble = 1; b.until = t + 0.8; }
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
        if (dd < reach) step(b, dx / dd, dy / dd, ((reach - dd) / reach) * 220 * b.c.flinchForce * (0.5 + P.jumpy), 0.25);
      }
      // keep off the text: ease the position out, no velocity, so it never slides
      if (inKeep(b.x, b.y, r)) {
        const pl = b.x + r - keep.l, pr = keep.r - (b.x - r), pt = b.y + r - keep.t, pb = keep.b - (b.y - r);
        const m = Math.min(pl, pr, pt, pb);
        const k = Math.min(1, 6 * dt);
        if (m === pl) { b.x -= pl * k; if (b.vx > 0) b.vx = 0; }
        else if (m === pr) { b.x += pr * k; if (b.vx < 0) b.vx = 0; }
        else if (m === pt) { b.y -= pt * k; if (b.vy > 0) b.vy = 0; }
        else { b.y += pb * k; if (b.vy < 0) b.vy = 0; }
      }
      // edges (the visual box, not the hit radius)
      const hb = b.d / 2;
      const edge = 70;
      const ef = 500 * dt;
      if (b.x - hb < edge) b.vx += ef * (1 - (b.x - hb) / edge);
      if (W - b.x - hb < edge) b.vx -= ef * (1 - (W - b.x - hb) / edge);
      if (b.y - hb < edge) b.vy += ef * (1 - (b.y - hb) / edge);
      if (H - b.y - hb < edge) b.vy -= ef * (1 - (H - b.y - hb) / edge);
      // friction
      let fr = 0.006; // steps stop dead between pushes
      if (st === "chase") fr = 0.02;
      else if (st === "greet") fr = 0.02;
      else if (st === "idle" || st === "curious" || st === "sulk" || st === "nap" || st === "startled" || st === "celebrate") fr = 0.08;
      if (b.hop) fr = b.hop.phase === "ant" ? 0.02 : b.hop.phase === "air" ? 0.6 : 0.08;
      if (st === "thrown" && b.hop) fr = 0.6;
      if (b.dashing) fr = 0.95;
      if (t < b.stickUntil) fr = 0.0005; // squished against something: no sliding
      const k = Math.pow(fr, dt);
      b.vx *= k; b.vy *= k;
      // clamp
      const airborne = (b.hop && b.hop.phase === "air") || b.dashing;
      if (!airborne && st !== "thrown") {
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
        b.heading = wx === 0 || wx === W ? 0 : Math.PI / 2; // squash against the wall
        b.s = Math.max(b.c.sClamp[0], Math.min(b.s, -sq));
        b.sv = -1.5 * sqGain(b);
        b.stickUntil = t + 0.15;
      }
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
      b.qv += (150 * (b.qTarget - b.q) - c * b.qv) * dt;
      b.q += b.qv * dt;
      b.q = clamp(b.q, -0.35, 0.45);
      if (speed > 15 && !b.grabbed) {
        const h = Math.atan2(b.vy, b.vx);
        b.heading = lerpAngle(b.heading, h, 1 - Math.pow(0.0005, dt * b.c.headingRate));
      }
      b.heading += b.hv * dt;
      b.hv *= Math.pow(0.02, dt);
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
        if (b.hop) tickHop(b);
        if (!b.forceRender && frame % b.hold !== 0) continue;
        b.forceRender = false;
        const c = b.c;
        const half = b.d / 2;
        const tr = b.tremble && !reduced ? Math.round((rand() - 0.5) * 2) : 0;
        set(b, "el", b.el, "transform", `translate3d(${Math.round(b.x - half + tr)}px, ${Math.round(b.y - half + tr)}px, 0)`);

        const alt = b.alt;
        const P = 1 + 0.06 * alt + 0.18 * alt * b.power;
        const lift = Math.round(alt * (8 + 12 * b.power));
        set(b, "pop", b.pop, "transform", `translateY(${-lift}px) scale(${q(P * (1 + b.q), 0.02)}, ${q(P * (1 - 0.8 * b.q), 0.02)})`);

        const sh = (1 - 0.45 * alt) * (1 + 0.3 * Math.max(0, b.s)) + b.shKick;
        set(b, "sh", b.shadow, "transform", `scaleX(${q(sh, 0.05)}) scaleY(${q(1 - 0.3 * alt, 0.05)})`);
        set(b, "sho", b.shadow, "opacity", alt > 0.5 ? "0.5" : "1");

        const sx = 1 + b.s, sy = 1 - 0.6 * b.s;
        const h = q5deg(b.heading);
        let bodyT: string;
        let faceRot: number;
        if (c.nose !== null) {
          bodyT = `rotate(${h.toFixed(3)}rad) scale(${q(sx, 0.04)}, ${q(sy, 0.04)}) rotate(${(-c.nose).toFixed(3)}rad)`;
          faceRot = h - c.nose;
        } else {
          const tilt = q5deg(b.tilt);
          bodyT = `rotate(${h.toFixed(3)}rad) scale(${q(sx, 0.04)}, ${q(sy, 0.04)}) rotate(${(-h).toFixed(3)}rad) rotate(${tilt.toFixed(3)}rad)`;
          faceRot = tilt;
        }
        set(b, "body", b.body, "transform", bodyT);

        // outline boil
        if (!reduced || !b.last.d) {
          const jitter = reduced ? 0 : c.boil * b.boilMul;
          const d = roundedPolygon(c.verts, c.radius, jitter, rand);
          if (b.last.d !== d) { b.last.d = d; for (const p of b.paths) p.setAttribute("d", d); }
        }

        // eyes: lag + gaze
        let ox = b.ex - b.x, oy = b.ey - b.y;
        const maxLag = b.d * 0.16;
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
        if (c.gazeOn === "face") {
          set(b, "face", b.face, "transform", `translate(${Math.round(ox + gx + jx)}px, ${Math.round(oy + gy)}px) rotate(${faceRot.toFixed(3)}rad)`);
        } else {
          set(b, "face", b.face, "transform", `translate(${Math.round(ox + jx)}px, ${Math.round(oy)}px) rotate(${faceRot.toFixed(3)}rad)`);
          const pr = c.pupilRange;
          const px = clamp((gx / b.scale) * 0.6, -pr, pr), py = clamp((gy / b.scale) * 0.6, -pr, pr);
          set(b, "pup", b.pupilsG, "transform", `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)${b.dilate ? " scale(1.25)" : ""}`);
        }
        const blinking = t < b.blinkUntil;
        const happy = t < b.happyUntil;
        let lid = 1;
        if (b.napping) lid = 0.12;
        else if (blinking && !b.winking) lid = 0.12;
        else if (b.squint) lid = 0.55;
        else if (happy) lid = 0.35;
        set(b, "cheeks", b.cheeks, "transform", happy ? "scale(1.35)" : "none");
        const es = b.eyeScale;
        set(b, "eyes", b.eyesG, "transform", `scale(${q(es, 0.05)}, ${q(es * lid, 0.05)})`);
        set(b, "wink", b.wink, "transform", blinking && b.winking ? "scaleY(0.12)" : "none");
        set(b, "mouth", b.mouth, "transform", t < b.grinUntil ? "scaleX(1.2)" : "none");
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
      const w = window as unknown as { __blobs: Blob[]; __blobTick: (dt: number, n: number) => void };
      w.__blobs = blobs;
      w.__blobTick = (dt, n) => { for (let i = 0; i < n; i++) tick(dt); };
    }
    render();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={rootRef} className="blobs" aria-hidden="true">
      {CAST.map((c, i) => (
        <div key={c.name} className="blob" data-name={c.name} style={{ animationDelay: `${400 + i * 120}ms` }}>
          <div className="blob-shadow" />
          <div className="blob-pop">
            <svg className="blob-body" viewBox="0 0 100 100" overflow="visible">
              <g>
                <path className="ink" />
                <path className="ink2" />
              </g>
            </svg>
            <svg className="blob-face" viewBox="0 0 100 100" overflow="visible" />
          </div>
        </div>
      ))}
    </div>
  );
}
