/**
 * The five characters. Shapes are polygons in a 0..100 box that get rounded
 * corners and a per-vertex wobble at render time. Faces are inline SVG in the
 * same box, drawn in currentColor (the black drum) with #fff whites (a
 * knockout to the paper under the blob's multiply blend).
 */

export type Personality = {
  speed: number;
  restless: number;
  social: number;
  jumpy: number;
  squishy: number;
};

export type Gait = "dart" | "drift" | "amble" | "hoppy";

/** The four drums. Everything on the page is one of these or an overlap of them. */
export const INKS = {
  pink: "#ff48b0", // Fluorescent Pink
  blue: "#0078bf", // Blue
  yellow: "#ffe800", // Yellow
  black: "#1b1917",
} as const;
export type InkName = keyof typeof INKS;
export type InkPass = { ink: InkName; a: number };

/** What a stack of translucent ink passes prints as (multiply, like the real thing). */
export function mixInks(stack: InkPass[]): string {
  let r = 1, g = 1, b = 1;
  for (const p of stack) {
    const hex = INKS[p.ink];
    const ir = parseInt(hex.slice(1, 3), 16) / 255, ig = parseInt(hex.slice(3, 5), 16) / 255, ib = parseInt(hex.slice(5, 7), 16) / 255;
    r = r * (1 - p.a) + r * ir * p.a;
    g = g * (1 - p.a) + g * ig * p.a;
    b = b * (1 - p.a) + b * ib * p.a;
  }
  const h = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

export type Char = {
  name: string;
  inks: InkPass[]; // printed bottom to top
  falloff: number;
  verts: [number, number][];
  radius: number;
  fill: number;
  bottom: number;
  nose: number | null;
  lean: number;
  size: number;
  P: Personality;
  gait: Gait;
  boil: number;
  hold: number;
  bounce: number;
  sClamp: [number, number];
  spring: [number, number];
  headingRate: number;
  mass: number;
  flinchReach: number;
  flinchForce: number;
  gaze: number;
  gazeHeading: boolean;
  eyeSpring: [number, number];
  blink: [number, number];
  blinkDur: number;
  doubleP: number;
  winkP: number;
  eyeJitter: boolean;
  napProne: number;
  shy: boolean;
  eyes: { l: Eye; r: Eye; lidRest: number; lidLine: boolean };
  mouth: { x: number; y: number; s: number }; // where the mouth sits and how big
  extras: string; // brows, mouth, cheeks: inline SVG in the same 0..100 box
};

export type Eye = { cx: number; cy: number; r: number; pr: number };

const deg = (d: number) => (d * Math.PI) / 180;

export const CAST: Char[] = [
  {
    // A zippy little square, thrilled by everything.
    name: "Fizz",
    inks: [{ ink: "pink", a: 1 }],
    falloff: 115,
    verts: [[24, 20], [80, 26], [76, 80], [20, 76]],
    radius: 20,
    fill: 0.72,
    bottom: 80,
    nose: null,
    lean: deg(15),
    size: 58,
    P: { speed: 0.95, restless: 0.7, social: 0.4, jumpy: 0.85, squishy: 0.3 },
    gait: "dart",
    boil: 2.5,
    hold: 1,
    bounce: 0.5,
    sClamp: [-0.5, 0.7],
    spring: [380, 22],
    headingRate: 1,
    mass: 0.6,
    flinchReach: 140,
    flinchForce: 1.2,
    gaze: 1.5,
    gazeHeading: false,
    eyeSpring: [520, 18],
    blink: [900, 2200],
    blinkDur: 80,
    doubleP: 0.3,
    winkP: 0,
    eyeJitter: false,
    napProne: 0,
    shy: false,
    eyes: { l: { cx: 38, cy: 46, r: 9.5, pr: 5 }, r: { cx: 62, cy: 46, r: 9.5, pr: 5 }, lidRest: 0, lidLine: true },
    mouth: { x: 50, y: 61, s: 1 },
    extras:
      "",
  },
  {
    // A heavy, contented loaf that is asleep more often than not.
    name: "Loaf",
    inks: [{ ink: "blue", a: 1 }],
    falloff: 250,
    verts: [[10, 42], [30, 18], [70, 16], [92, 40], [86, 78], [16, 82]],
    radius: 15,
    fill: 0.82,
    bottom: 82,
    nose: null,
    lean: deg(10),
    size: 104,
    P: { speed: 0.1, restless: 0.08, social: 0.5, jumpy: 0.02, squishy: 0.85 },
    gait: "drift",
    boil: 1,
    hold: 2,
    bounce: 0.4,
    sClamp: [-0.45, 0.5],
    spring: [140, 9],
    headingRate: 1,
    mass: 3.2,
    flinchReach: 30,
    flinchForce: 0.3,
    gaze: 0.5,
    gazeHeading: false,
    eyeSpring: [200, 16],
    blink: [5000, 9000],
    blinkDur: 450,
    doubleP: 0,
    winkP: 0,
    eyeJitter: false,
    napProne: 1,
    shy: false,
    eyes: { l: { cx: 32, cy: 54, r: 9, pr: 4.5 }, r: { cx: 68, cy: 54, r: 9, pr: 4.5 }, lidRest: 0.55, lidLine: true },
    mouth: { x: 50, y: 69, s: 1.15 },
    extras:
      "",
  },
  {
    // Wide-eyed and nosy; comes over to see what you are doing.
    name: "Pip",
    inks: [{ ink: "yellow", a: 1 }, { ink: "blue", a: 0.72 }],
    falloff: 30,
    verts: [[50, 11], [12, 41], [18, 87], [82, 87], [88, 41]],
    radius: 11,
    fill: 0.76,
    bottom: 87,
    nose: null,
    lean: deg(12),
    size: 70,
    P: { speed: 0.6, restless: 0.7, social: 1, jumpy: 0.45, squishy: 0.55 },
    gait: "amble",
    boil: 1.8,
    hold: 1,
    bounce: 0.7,
    sClamp: [-0.4, 0.6],
    spring: [260, 16],
    headingRate: 1,
    mass: 1,
    flinchReach: 0,
    flinchForce: 0,
    gaze: 1.6,
    gazeHeading: false,
    eyeSpring: [380, 20],
    blink: [2500, 4000],
    blinkDur: 120,
    doubleP: 0.2,
    winkP: 0,
    eyeJitter: false,
    napProne: 0.1,
    shy: false,
    eyes: { l: { cx: 36, cy: 48, r: 13, pr: 7 }, r: { cx: 62, cy: 48, r: 13, pr: 7 }, lidRest: 0, lidLine: true },
    mouth: { x: 49, y: 69, s: 1 },
    extras:
      "",
  },
  {
    // A plump, bashful pear that blushes when anyone comes close.
    name: "Nib",
    inks: [{ ink: "yellow", a: 1 }, { ink: "pink", a: 0.82 }],
    falloff: 200,
    verts: [[50, 10], [78, 30], [86, 64], [64, 92], [36, 92], [14, 64], [22, 30]],
    radius: 16,
    fill: 0.8,
    bottom: 92,
    nose: null,
    lean: deg(12),
    size: 78,
    P: { speed: 0.35, restless: 0.35, social: 0.85, jumpy: 0.5, squishy: 0.8 },
    gait: "amble",
    boil: 1.5,
    hold: 1,
    bounce: 0.6,
    sClamp: [-0.4, 0.5],
    spring: [220, 14],
    headingRate: 1,
    mass: 1.7,
    flinchReach: 60,
    flinchForce: 0.4,
    gaze: 0.9,
    gazeHeading: false,
    eyeSpring: [340, 18],
    blink: [2000, 3800],
    blinkDur: 130,
    doubleP: 0.15,
    winkP: 0,
    eyeJitter: false,
    napProne: 0.15,
    shy: true,
    eyes: { l: { cx: 38, cy: 46, r: 11, pr: 6 }, r: { cx: 62, cy: 46, r: 11, pr: 6 }, lidRest: 0.1, lidLine: true },
    mouth: { x: 50, y: 62, s: 1 },
    extras:
      "",
  },
  {
    // A jolly jumping bean that treats the page as a trampoline.
    name: "Bop",
    inks: [{ ink: "yellow", a: 1 }],
    falloff: 300,
    verts: [[52, 6], [80, 30], [76, 74], [48, 94], [20, 70], [24, 26]],
    radius: 10,
    fill: 0.78,
    bottom: 94,
    nose: null,
    lean: deg(20),
    size: 62,
    P: { speed: 0.7, restless: 0.8, social: 0.7, jumpy: 1, squishy: 1 },
    gait: "hoppy",
    boil: 2,
    hold: 1,
    bounce: 0.95,
    sClamp: [-0.7, 0.7],
    spring: [260, 13],
    headingRate: 1,
    mass: 0.7,
    flinchReach: 40,
    flinchForce: 0.6,
    gaze: 0.4,
    gazeHeading: true,
    eyeSpring: [300, 15],
    blink: [1800, 3500],
    blinkDur: 100,
    doubleP: 0,
    winkP: 0.25,
    eyeJitter: false,
    napProne: 0.05,
    shy: false,
    eyes: { l: { cx: 39, cy: 44, r: 12, pr: 6.5 }, r: { cx: 62, cy: 41, r: 9, pr: 5 }, lidRest: 0, lidLine: true },
    mouth: { x: 51, y: 63, s: 1.15 },
    extras:
      "",
  },
];

/** Mouth shapes, centered on the mouth anchor, about 14 units wide. */
export const MOUTHS: Record<string, { d: string; fill: boolean }> = {
  smile: { d: "M-6 0 Q0 5 6 0", fill: false },
  grin: { d: "M-7 -1 Q0 11 7 -1 Z", fill: true },
  frown: { d: "M-6 2 Q0 -3 6 2", fill: false },
  o: { d: "M-3 0 a3 3.6 0 1 0 6 0 a3 3.6 0 1 0 -6 0", fill: true },
  yawn: { d: "M-4.5 0 a4.5 5.5 0 1 0 9 0 a4.5 5.5 0 1 0 -9 0", fill: true },
  flat: { d: "M-5 0 L5 0", fill: false },
  wavy: { d: "M-6 0 Q-3 -3 0 0 Q3 3 6 0", fill: false },
  smirk: { d: "M-5 1 Q2 3 6.5 -2.5", fill: false },
  small: { d: "M-2.5 0 Q0 2 2.5 0", fill: false },
  w: { d: "M-6 0 Q-3 4 0 0 Q3 4 6 0", fill: false },
  none: { d: "", fill: false },
};

/** Inline SVG for a face: whites, pupils with a catchlight, and an ink-colored lid per eye. */
export function makeFace(c: Char, uid: string): string {
  const eye = (e: Eye, k: string) => {
    const id = `eye-${uid}-${k}`;
    const s = e.r * 2 + 2;
    const x = e.cx - e.r - 1;
    const y = e.cy - e.r - 1;
    return (
      `<clipPath id="${id}"><circle cx="${e.cx}" cy="${e.cy}" r="${e.r}"/></clipPath>` +
      `<g class="eye" clip-path="url(#${id})">` +
      `<circle cx="${e.cx}" cy="${e.cy}" r="${e.r}" fill="#fff"/>` +
      `<g class="pupils"><circle cx="${e.cx}" cy="${e.cy + 0.5}" r="${e.pr}"/>` +
      `<circle cx="${e.cx + e.pr * 0.35}" cy="${e.cy - e.pr * 0.4}" r="${Math.max(1.2, e.pr * 0.3).toFixed(1)}" fill="#fff"/></g>` +
      `<g class="lid" data-span="${s}" style="transform:translate(0px,${-s}px)"><rect x="${x}" y="${y}" width="${s}" height="${s}" fill="var(--ink)"/>` +
      (c.eyes.lidLine ? `<path d="M${x} ${y + s} H${x + s}" stroke="currentColor" stroke-width="2.5" fill="none"/>` : "") +
      `</g>` +
      // lower lid: slides up with an arched edge, so a happy eye closes into a ^
      `<g class="lidlo" data-span="${s}" style="transform:translate(0px,${s}px)">` +
      `<path d="M${x} ${y + 4} Q${e.cx} ${y - 3} ${x + s} ${y + 4} V${y + s} H${x} Z" fill="var(--ink)"/>` +
      `<path d="M${x} ${y + 4} Q${e.cx} ${y - 3} ${x + s} ${y + 4}" stroke="currentColor" stroke-width="2.5" fill="none"/>` +
      `</g></g>`
    );
  };
  const brow = (e: Eye) =>
    `<path class="brow" d="M${e.cx - 5.5} ${e.cy - e.r - 5} Q${e.cx} ${e.cy - e.r - 8.5} ${e.cx + 5.5} ${e.cy - e.r - 5}"/>`;
  const { l, r } = c.eyes;
  const m = c.mouth;
  return (
    `<g class="cheeks" fill="${INKS.pink}" opacity="0"><ellipse cx="${l.cx - 12}" cy="${l.cy + 12}" rx="6.5" ry="3.8"/><ellipse cx="${r.cx + 12}" cy="${r.cy + 12}" rx="6.5" ry="3.8"/></g>` +
    `<g class="eyes">${eye(l, "l")}${eye(r, "r")}</g>` +
    `<g class="brows" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" opacity="0">${brow(l)}${brow(r)}</g>` +
    `<g transform="translate(${m.x} ${m.y}) scale(${m.s})"><path class="mouth" d="${MOUTHS.smile.d}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></g>` +
    c.extras
  );
}

/** Cartoon marks that pop up above a head. 40 x 30 box, drawn in the black drum. */
export const EMOTES: Record<string, string> = {
  pop:
    '<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">' +
    '<path d="M20 2 L20 7"/><path d="M7 7 L11 10.5"/><path d="M33 7 L29 10.5"/><path d="M3 19 L8 19"/><path d="M37 19 L32 19"/>' +
    '<path d="M8 29 L11.5 25.5"/><path d="M32 29 L28.5 25.5"/></g>',
  laugh:
    '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M3 5 L3 17 M3 11 Q6 9 8 11 L8 17"/><path d="M15 12 Q12 11 12 14 Q12 17 15 16.5 L15 11 L15 17"/>' +
    '<path d="M22 6 L22 18 M22 12 Q25 10 27 12 L27 18"/><path d="M34 13 Q31 12 31 15 Q31 18 34 17.5 L34 12 L34 18"/></g>',
  angry:
    '<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">' +
    '<path d="M14 5 Q13 11 8 13"/><path d="M26 5 Q27 11 32 13"/><path d="M8 19 Q13 21 14 27"/><path d="M32 19 Q27 21 26 27"/></g>',
  bang:
    '<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">' +
    '<path d="M20 3 L19.5 17"/><path d="M19.5 23 L19.5 24"/><path d="M9 7 L12 11" stroke-width="2"/><path d="M31 7 L28 11" stroke-width="2"/></g>',
  q:
    '<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">' +
    '<path d="M13 9 Q13 2 20 2.5 Q27 3 26 9 Q25 13 20 14 L20 18"/><path d="M20 24 L20 25"/></g>',
  heart:
    '<path d="M20 27 C9 19 7 11 13 7.5 C16.5 6 19.5 8 20 11 C20.5 8 23.5 6 27 7.5 C33 11 31 19 20 27 Z" fill="currentColor"/>',
  dizzy:
    '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
    '<path d="M20 15 m-8 0 a8 8 0 1 1 16 0 a5.5 5.5 0 1 1 -11 0 a3 3 0 1 1 6 0"/><path d="M4 6 L8 10 M8 6 L4 10"/><path d="M32 4 L36 8 M36 4 L32 8"/></g>',
  sweat: '<path d="M22 4 C22 10 14 15 14 21 a8 8 0 0 0 16 0 C30 15 22 10 22 4 Z" fill="currentColor"/>',
  sweats:
    '<g fill="currentColor"><path d="M9 4 C9 8 4 11 4 15 a5 5 0 0 0 10 0 C14 11 9 8 9 4 Z"/>' +
    '<path d="M21 9 C21 13 16 16 16 20 a5 5 0 0 0 10 0 C26 16 21 13 21 9 Z"/><path d="M33 3 C33 7 28 10 28 14 a5 5 0 0 0 10 0 C38 10 33 7 33 3 Z"/></g>',
  notes:
    '<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 22 L12 6 L20 4 L20 19"/><circle cx="9" cy="22" r="3" fill="currentColor"/><circle cx="17" cy="19" r="3" fill="currentColor"/>' +
    '<path d="M31 18 L31 7"/><circle cx="28" cy="18" r="3" fill="currentColor"/><path d="M31 7 Q36 8 35 12"/></g>',
  sparkle:
    '<g fill="currentColor"><path d="M20 2 L22.5 12 L32 14.5 L22.5 17 L20 27 L17.5 17 L8 14.5 L17.5 12 Z"/>' +
    '<path d="M33 20 L34.5 25 L39.5 26.5 L34.5 28 L33 33 L31.5 28 L26.5 26.5 L31.5 25 Z"/><path d="M6 3 L7 6 L10 7 L7 8 L6 11 L5 8 L2 7 L5 6 Z"/></g>',
  dots: '<g fill="currentColor"><circle cx="8" cy="16" r="3.2"/><circle cx="20" cy="16" r="3.2"/><circle cx="32" cy="16" r="3.2"/></g>',
  bang2:
    '<g fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round">' +
    '<path d="M13 3 L12.5 17"/><path d="M12.5 23 L12.5 24"/><path d="M27 3 L26.5 17"/><path d="M26.5 23 L26.5 24"/></g>',
  wow:
    '<g fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round">' +
    '<path d="M6 9 Q6 2 13 2.5 Q20 3 19 9 Q18 13 13 14 L13 18"/><path d="M13 24 L13 25"/><path d="M31 3 L30.5 17"/><path d="M30.5 23 L30.5 24"/></g>',
  cloud:
    '<path d="M10 20 a6 6 0 0 1 2 -11.5 a8 8 0 0 1 15 -1 a6 6 0 0 1 4 12.5 Z" fill="currentColor"/>' +
    '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 24 L10 29"/><path d="M20 24 L18 29"/><path d="M28 24 L26 29"/></g>',
  hearts:
    '<g fill="currentColor"><path d="M10 15 C4 11 3 6 6.5 4.5 C8.5 3.5 10 4.5 10 6 C10 4.5 11.5 3.5 13.5 4.5 C17 6 16 11 10 15 Z"/>' +
    '<path d="M27 27 C19 21 17 14 22 12 C24.5 11 27 12.5 27 15 C27 12.5 29.5 11 32 12 C37 14 35 21 27 27 Z"/><path d="M33 9 C29 6.5 28.5 3 31 2 C32.5 1.5 33 2.5 33 3.5 C33 2.5 33.5 1.5 35 2 C37.5 3 37 6.5 33 9 Z"/></g>',
  star:
    '<path d="M20 2 L24 14 L37 14 L26.5 21.5 L30.5 34 L20 26.5 L9.5 34 L13.5 21.5 L3 14 L16 14 Z" fill="currentColor"/>',
  zap: '<path d="M23 2 L9 17 L18 17 L15 30 L31 12 L22 12 Z" fill="currentColor"/>',
};

/** Impact bursts. 40 x 40 box centered at (20,20), pointing +x; picked at random per hit. */
export const IMPACTS: string[] = [
  // radial ticks
  '<g fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M27 20 L37 20"/><path d="M26 14 L33 7"/><path d="M26 26 L33 33"/><path d="M22 10 L24 3"/><path d="M22 30 L24 37"/></g>',
  // spiky star
  '<path fill="currentColor" d="M20 3 L23.5 14.5 L35 10 L27 19.5 L38 26 L25.5 25 L23 38 L18 26.5 L6 31 L13.5 20.5 L3 13 L16 15.5 Z"/>',
  // jagged pow cloud
  '<path fill="currentColor" d="M20 6 L25 13 L33 9 L31 18 L38 22 L30 26 L32 35 L24 30 L20 37 L16 30 L8 35 L10 26 L2 22 L9 18 L7 9 L15 13 Z"/>',
  // fat dashes fanning out
  '<g fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"><path d="M24 20 L36 20"/><path d="M23 12 L32 5"/><path d="M23 28 L32 35"/></g>',
  // shock arcs
  '<g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M24 8 Q33 20 24 32"/><path d="M30 4 Q42 20 30 36"/></g>',
  // sparkle: dots and short strokes
  '<g fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="34" cy="12" r="3"/><circle cx="35" cy="29" r="2.4"/><circle cx="24" cy="36" r="2"/><path d="M26 20 L33 20" fill="none"/><path d="M23 10 L25 5" fill="none"/></g>',
];

/** Closed path through `verts` with rounded corners, with an optional per-vertex jitter. */
export function roundedPolygon(
  verts: [number, number][],
  radius: number,
  jitter: number,
  rnd: () => number,
): string {
  const n = verts.length;
  const pts = verts.map(([x, y]) =>
    jitter ? [x + (rnd() - 0.5) * 2 * jitter, y + (rnd() - 0.5) * 2 * jitter] : [x, y],
  );
  let d = "";
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const ax = p0[0] - p1[0];
    const ay = p0[1] - p1[1];
    const bx = p2[0] - p1[0];
    const by = p2[1] - p1[1];
    const al = Math.hypot(ax, ay) || 1;
    const bl = Math.hypot(bx, by) || 1;
    const r = Math.min(radius, al / 2, bl / 2);
    const sx = p1[0] + (ax / al) * r;
    const sy = p1[1] + (ay / al) * r;
    const ex = p1[0] + (bx / bl) * r;
    const ey = p1[1] + (by / bl) * r;
    d += (i === 0 ? "M" : "L") + sx.toFixed(1) + " " + sy.toFixed(1);
    d += "Q" + p1[0].toFixed(1) + " " + p1[1].toFixed(1) + " " + ex.toFixed(1) + " " + ey.toFixed(1);
  }
  return d + "Z";
}

/** A fixed set of phases for one body's edge noise, rolled once at birth. */
export type Edge = { fat: number; amp: number; step: number; phases: number[] };
const EDGE_F = [5, 9, 17, 31];
const EDGE_W = [0.42, 0.3, 0.18, 0.1];

/**
 * The same rounded polygon with the risograph edge baked into the geometry:
 * the curve is sampled every `step` units and pushed along its normal by a
 * hair of fattening plus a little noise that is fixed around the outline.
 * This replaces the feDisplacementMap filter on the bodies, which WebKit
 * re-runs on the CPU every time a body changes (every frame, here).
 */
export function roughOutline(
  verts: [number, number][],
  radius: number,
  jitter: number,
  rnd: () => number,
  edge: Edge,
): string {
  const n = verts.length;
  const pts = verts.map(([x, y]) =>
    jitter ? [x + (rnd() - 0.5) * 2 * jitter, y + (rnd() - 0.5) * 2 * jitter] : [x, y],
  );
  // corner geometry: each corner is a straight run into a quadratic turn
  const corners: { sx: number; sy: number; px: number; py: number; ex: number; ey: number }[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const ax = p0[0] - p1[0];
    const ay = p0[1] - p1[1];
    const bx = p2[0] - p1[0];
    const by = p2[1] - p1[1];
    const al = Math.hypot(ax, ay) || 1;
    const bl = Math.hypot(bx, by) || 1;
    const r = Math.min(radius, al / 2, bl / 2);
    corners.push({
      sx: p1[0] + (ax / al) * r, sy: p1[1] + (ay / al) * r,
      px: p1[0], py: p1[1],
      ex: p1[0] + (bx / bl) * r, ey: p1[1] + (by / bl) * r,
    });
  }
  // sample the outline at a steady spacing
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const c = corners[i];
    const prev = corners[(i + n - 1) % n];
    const lx = c.sx - prev.ex, ly = c.sy - prev.ey;
    const ll = Math.hypot(lx, ly);
    const lk = Math.max(1, Math.round(ll / edge.step));
    for (let k = 0; k < lk; k++) { const t = k / lk; xs.push(prev.ex + lx * t); ys.push(prev.ey + ly * t); }
    const ql = Math.hypot(c.px - c.sx, c.py - c.sy) + Math.hypot(c.ex - c.px, c.ey - c.py);
    const qk = Math.max(2, Math.round(ql / edge.step));
    for (let k = 0; k < qk; k++) {
      const t = k / qk, u = 1 - t;
      xs.push(u * u * c.sx + 2 * u * t * c.px + t * t * c.ex);
      ys.push(u * u * c.sy + 2 * u * t * c.py + t * t * c.ey);
    }
  }
  const m = xs.length;
  let cx = 0, cy = 0;
  for (let i = 0; i < m; i++) { cx += xs[i]; cy += ys[i]; }
  cx /= m; cy /= m;
  let d = "";
  for (let i = 0; i < m; i++) {
    // outward normal from the neighbours
    const tx = xs[(i + 1) % m] - xs[(i + m - 1) % m];
    const ty = ys[(i + 1) % m] - ys[(i + m - 1) % m];
    const tl = Math.hypot(tx, ty) || 1;
    let nx = ty / tl, ny = -tx / tl;
    if (nx * (xs[i] - cx) + ny * (ys[i] - cy) < 0) { nx = -nx; ny = -ny; }
    const u = i / m;
    let noise = 0;
    for (let k = 0; k < EDGE_F.length; k++) noise += EDGE_W[k] * Math.sin(2 * Math.PI * EDGE_F[k] * u + edge.phases[k]);
    const push = edge.fat + edge.amp * noise;
    d += (i === 0 ? "M" : "L") + (xs[i] + nx * push).toFixed(1) + " " + (ys[i] + ny * push).toFixed(1);
  }
  return d + "Z";
}
