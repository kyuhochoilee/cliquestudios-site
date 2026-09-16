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
  gazeOn: "face" | "pupils";
  pupilRange: number;
  eyeSpring: [number, number];
  blink: [number, number];
  blinkDur: number;
  doubleP: number;
  winkP: number;
  eyeJitter: boolean;
  napProne: number;
  shy: boolean;
  face: string;
};

const deg = (d: number) => (d * Math.PI) / 180;

export const CAST: Char[] = [
  {
    // A zippy little dart, thrilled by everything.
    name: "Fizz",
    ink: "#f15060",
    ink2: "#c81f3c",
    ink2Alpha: 0.45,
    falloff: 115,
    verts: [[50, 8], [88, 34], [80, 86], [30, 92], [12, 44]],
    radius: 5,
    fill: 0.8,
    bottom: 92,
    nose: deg(-90),
    lean: 0,
    size: 54,
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
    gazeOn: "face",
    pupilRange: 0,
    eyeSpring: [520, 18],
    blink: [900, 2200],
    blinkDur: 80,
    doubleP: 0.3,
    winkP: 0,
    eyeJitter: false,
    napProne: 0,
    shy: false,
    face:
      '<g class="eyes"><g class="pupils"><circle cx="42" cy="42" r="6.5"/><circle cx="58" cy="40" r="6.5"/><circle cx="44.5" cy="39.5" r="2" fill="#fff"/><circle cx="60.5" cy="37.5" r="2" fill="#fff"/></g></g>' +
      '<g class="brows" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M35 31 Q42 26 49 30"/><path d="M52 29 Q58 24 65 29"/></g>' +
      '<path class="mouth" d="M46 53 Q50 57 54 53" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
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
    gazeOn: "pupils",
    pupilRange: 2.5,
    eyeSpring: [200, 16],
    blink: [5000, 9000],
    blinkDur: 450,
    doubleP: 0,
    winkP: 0,
    eyeJitter: false,
    napProne: 1,
    shy: false,
    face:
      '<g class="eyes"><path d="M23 56 A9 9 0 0 0 41 56 Z" fill="#fff"/><path d="M59 56 A9 9 0 0 0 77 56 Z" fill="#fff"/>' +
      '<g class="pupils"><path d="M27.5 56 A4.5 4.5 0 0 0 36.5 56 Z"/><path d="M63.5 56 A4.5 4.5 0 0 0 72.5 56 Z"/></g>' +
      '<path d="M22 56 L42 56 M58 56 L78 56" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></g>',
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
    gazeOn: "pupils",
    pupilRange: 5,
    eyeSpring: [380, 20],
    blink: [2500, 4000],
    blinkDur: 120,
    doubleP: 0.2,
    winkP: 0,
    eyeJitter: false,
    napProne: 0.1,
    shy: false,
    face:
      '<g class="eyes"><circle cx="36" cy="48" r="13" fill="#fff"/><circle cx="62" cy="48" r="13" fill="#fff"/>' +
      '<g class="pupils"><circle cx="39" cy="49" r="7"/><circle cx="59" cy="49" r="7"/><circle cx="41.5" cy="46" r="2" fill="#fff"/><circle cx="61.5" cy="46" r="2" fill="#fff"/></g></g>',
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
    gazeOn: "pupils",
    pupilRange: 4,
    eyeSpring: [340, 18],
    blink: [2000, 3800],
    blinkDur: 130,
    doubleP: 0.15,
    winkP: 0,
    eyeJitter: false,
    napProne: 0.15,
    shy: true,
    face:
      '<g class="cheeks" fill="#ff48b0" opacity="0.8"><ellipse cx="26" cy="59" rx="6.5" ry="3.8"/><ellipse cx="74" cy="59" rx="6.5" ry="3.8"/></g>' +
      '<g class="eyes"><circle cx="38" cy="46" r="11" fill="#fff"/><circle cx="62" cy="46" r="11" fill="#fff"/>' +
      '<g class="pupils"><circle cx="40" cy="47" r="6"/><circle cx="60" cy="47" r="6"/><circle cx="42" cy="44.5" r="1.8" fill="#fff"/><circle cx="62" cy="44.5" r="1.8" fill="#fff"/></g></g>' +
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
    gazeOn: "pupils",
    pupilRange: 4,
    eyeSpring: [300, 15],
    blink: [1800, 3500],
    blinkDur: 100,
    doubleP: 0,
    winkP: 0.25,
    eyeJitter: false,
    napProne: 0.05,
    shy: false,
    face:
      '<g class="eyes"><circle cx="39" cy="44" r="12" fill="#fff"/><circle class="wink" cx="62" cy="41" r="9" fill="#fff"/>' +
      '<g class="pupils"><circle cx="41" cy="45" r="6.5"/><circle class="wink" cx="63" cy="42" r="5"/><circle cx="43" cy="42.5" r="2" fill="#fff"/><circle class="wink" cx="64.5" cy="40" r="1.5" fill="#fff"/></g></g>' +
      '<path class="mouth" d="M43 60 Q51 72 59 60 Z"/>',
  },
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
