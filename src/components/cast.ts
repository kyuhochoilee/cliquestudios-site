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
    extras:
      '<path class="mouth" d="M45 62 Q50 67 55 62" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
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
    extras:
      '<g class="cheeks" fill="#ff48b0" opacity="0.8"><ellipse cx="26" cy="59" rx="6.5" ry="3.8"/><ellipse cx="74" cy="59" rx="6.5" ry="3.8"/></g>' +
      '<path class="mouth" d="M45 62 Q47.5 65.5 50 62 Q52.5 65.5 55 62" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
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

/** Accessories: a hat or glasses drawn in the black drum with an ink fill that lands a hair off. */
export type Accessory = "none" | "specs" | "shades" | "party" | "beanie" | "bow" | "crown" | "flower" | "tophat";
export const ACCESSORIES: Accessory[] = ["none", "specs", "shades", "party", "beanie", "bow", "crown", "flower", "tophat"];

export function makeAccessory(kind: Accessory, c: Char): string {
  if (kind === "none") return "";
  const top = c.verts.reduce((a, v) => (v[1] < a[1] ? v : a));
  const hx = top[0], hy = top[1] + 2;
  const { l, r } = c.eyes;
  // an ink fill printed a hair off, then the black outline
  const pair = (d: string, ink: string, o = 2.2) =>
    `<path d="${d}" transform="translate(0.9,-0.7)" fill="${ink}"/>` +
    `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${o}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const circ = (cx: number, cy: number, rr: number) => `M${cx - rr} ${cy} a${rr} ${rr} 0 1 0 ${rr * 2} 0 a${rr} ${rr} 0 1 0 ${-rr * 2} 0`;
  switch (kind) {
    case "specs":
      return `<g class="acc" fill="none" stroke="currentColor" stroke-width="2.6">` +
        `<circle cx="${l.cx}" cy="${l.cy}" r="${l.r + 3.5}"/><circle cx="${r.cx}" cy="${r.cy}" r="${r.r + 3.5}"/>` +
        `<path d="M${l.cx + l.r + 3.5} ${l.cy - 2} Q${(l.cx + r.cx) / 2} ${l.cy - 6} ${r.cx - r.r - 3.5} ${r.cy - 2}"/></g>`;
    case "shades":
      return `<g class="acc">` +
        `<circle cx="${l.cx}" cy="${l.cy}" r="${l.r + 3}" fill="${INKS.blue}" opacity="0.55" style="mix-blend-mode:multiply"/>` +
        `<circle cx="${r.cx}" cy="${r.cy}" r="${r.r + 3}" fill="${INKS.blue}" opacity="0.55" style="mix-blend-mode:multiply"/>` +
        `<g fill="none" stroke="currentColor" stroke-width="2.6"><circle cx="${l.cx}" cy="${l.cy}" r="${l.r + 3}"/><circle cx="${r.cx}" cy="${r.cy}" r="${r.r + 3}"/>` +
        `<path d="M${l.cx - l.r - 3} ${l.cy - 4} L${r.cx + r.r + 3} ${r.cy - 4}"/></g></g>`;
    case "party":
      return `<g class="acc" transform="rotate(-8 ${hx} ${hy})">` +
        pair(`M${hx - 13} ${hy + 3} L${hx} ${hy - 27} L${hx + 13} ${hy + 3} Z`, INKS.pink) +
        `<path d="M${hx - 8} ${hy - 9} L${hx + 8} ${hy - 9} M${hx - 4} ${hy - 18} L${hx + 4} ${hy - 18}" stroke="${INKS.yellow}" stroke-width="3.5" transform="translate(0.9,-0.7)"/>` +
        pair(circ(hx, hy - 28, 4.5), INKS.yellow) + `</g>`;
    case "beanie":
      return `<g class="acc">` +
        pair(`M${hx - 17} ${hy + 5} Q${hx - 17} ${hy - 15} ${hx} ${hy - 15} Q${hx + 17} ${hy - 15} ${hx + 17} ${hy + 5} Z`, INKS.blue) +
        pair(`M${hx - 18} ${hy} h36 v6 h-36 Z`, INKS.blue) +
        pair(circ(hx, hy - 17, 4.5), INKS.yellow) + `</g>`;
    case "bow": {
      const bx = hx + 16, by = hy - 2;
      return `<g class="acc" transform="rotate(20 ${bx} ${by})">` +
        pair(`M${bx} ${by} Q${bx - 18} ${by - 12} ${bx - 14} ${by} Q${bx - 18} ${by + 12} ${bx} ${by} Z`, INKS.pink) +
        pair(`M${bx} ${by} Q${bx + 18} ${by - 12} ${bx + 14} ${by} Q${bx + 18} ${by + 12} ${bx} ${by} Z`, INKS.pink) +
        pair(circ(bx, by, 3.5), INKS.yellow) + `</g>`;
    }
    case "crown":
      return `<g class="acc">` +
        pair(`M${hx - 16} ${hy + 4} L${hx - 16} ${hy - 12} L${hx - 8} ${hy - 3} L${hx} ${hy - 16} L${hx + 8} ${hy - 3} L${hx + 16} ${hy - 12} L${hx + 16} ${hy + 4} Z`, INKS.yellow) +
        `<g fill="${INKS.pink}" transform="translate(0.9,-0.7)"><circle cx="${hx - 16}" cy="${hy - 12}" r="2.4"/><circle cx="${hx}" cy="${hy - 16}" r="2.4"/><circle cx="${hx + 16}" cy="${hy - 12}" r="2.4"/></g></g>`;
    case "flower": {
      const fx = hx + 18, fy = hy + 1;
      let petals = "";
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        petals += pair(circ(fx + Math.cos(a) * 5.5, fy + Math.sin(a) * 5.5, 4.6), INKS.pink, 2);
      }
      return `<g class="acc">${petals}${pair(circ(fx, fy, 3.6), INKS.yellow, 2)}</g>`;
    }
    case "tophat":
      return `<g class="acc" transform="rotate(-6 ${hx} ${hy})">` +
        pair(`M${hx - 19} ${hy + 1} h38 v5 h-38 Z`, INKS.black) +
        pair(`M${hx - 12} ${hy + 1} v-23 h24 v23 Z`, INKS.black) +
        `<path d="M${hx - 12} ${hy - 6} h24 v5 h-24 Z" fill="${INKS.pink}" transform="translate(0.9,-0.7)"/></g>`;
  }
  return "";
}

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
