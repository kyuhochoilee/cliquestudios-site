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

export type Char = {
  name: string;
  ink: string;
  ink2: string | null;
  ink2Alpha: number;
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
  extras: string; // brows, mouth, cheeks: inline SVG in the same 0..100 box
};

export type Eye = { cx: number; cy: number; r: number; pr: number };

const deg = (d: number) => (d * Math.PI) / 180;

export const CAST: Char[] = [
  {
    // A zippy little square, thrilled by everything.
    name: "Fizz",
    ink: "#ff48b0",
    ink2: "#d61f87",
    ink2Alpha: 0.45,
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
    extras:
      '<path class="mouth" d="M45 62 Q50 67 55 62" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
  },
  {
    // A heavy, contented loaf that is asleep more often than not.
    name: "Loaf",
    ink: "#0078bf",
    ink2: "#ff48b0",
    ink2Alpha: 0.55,
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
    extras:
      "",
  },
  {
    // Wide-eyed and nosy; comes over to see what you are doing.
    name: "Pip",
    ink: "#00a95c",
    ink2: null,
    ink2Alpha: 0,
    falloff: 30,
    verts: [[89, 50], [59, 12], [13, 18], [13, 82], [59, 88]],
    radius: 11,
    fill: 0.76,
    bottom: 88,
    nose: 0,
    lean: 0,
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
    extras:
      "",
  },
  {
    // A plump, bashful pear that blushes when anyone comes close.
    name: "Nib",
    ink: "#ff6c2f",
    ink2: "#e04e14",
    ink2Alpha: 0.45,
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
    extras:
      '<g class="cheeks" fill="#ff48b0" opacity="0.8"><ellipse cx="26" cy="59" rx="6.5" ry="3.8"/><ellipse cx="74" cy="59" rx="6.5" ry="3.8"/></g>' +
      '<path class="mouth" d="M45 62 Q47.5 65.5 50 62 Q52.5 65.5 55 62" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
  },
  {
    // A jolly jumping bean that treats the page as a trampoline.
    name: "Bop",
    ink: "#ffe800",
    ink2: "#ffb511",
    ink2Alpha: 0.45,
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
    extras:
      '<path class="mouth" d="M43 60 Q51 72 59 60 Z"/>',
  },
];

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
  return (
    `<g class="eyes">${eye(c.eyes.l, "l")}${eye(c.eyes.r, "r")}</g>` +
    `<g class="brows" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" opacity="0">${brow(c.eyes.l)}${brow(c.eyes.r)}</g>` +
    c.extras
  );
}

/** Cartoon marks that pop up above a head. 40 x 30 box, drawn in the black drum. */
export const EMOTES: Record<string, string> = {
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
};

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
