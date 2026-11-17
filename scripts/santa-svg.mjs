// Builds The Nice List's logo: a warm, classic mid-century American style winking Santa.
// Original artwork. Run: node scripts/santa-svg.mjs → writes public/santa.svg and src/app/icon.svg
//
// Painterly rendering: soft gradients and shadow shapes define the forms; there are no ink
// outlines, only a few thin warm-brown lines for the eyes and smile.
import fs from "node:fs";

const LINE = "#6b3423"; // warm brown, for facial lines
const FUR_EDGE = "#cfc3ae"; // soft edge between white fur shapes
const FUR_SHADE = "#e3d9c6";

const out = [];
const path = (d, attrs) => out.push(`<path d="${d}" ${attrs}/>`);
const raw = (s) => out.push(s);

/** A fluffy outline through the points: each segment bulges away from the center. */
function fluffy(points, [cx, cy], bulge, close = true) {
  let d = `M${points[0][0]} ${points[0][1]}`;
  const n = close ? points.length : points.length - 1;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const len = Math.hypot(mx - cx, my - cy) || 1;
    d += `Q${(mx + ((mx - cx) / len) * bulge).toFixed(1)} ${(my + ((my - cy) / len) * bulge).toFixed(1)} ${x2} ${y2}`;
  }
  return d + (close ? "Z" : "");
}
const ring = (cx, cy, r, bumps) =>
  Array.from({ length: bumps }, (_, i) => {
    const a = (i / bumps) * Math.PI * 2;
    return [+(cx + Math.cos(a) * r).toFixed(1), +(cy + Math.sin(a) * r).toFixed(1)];
  });
const mirror = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${+(120 - x).toFixed(1)} ${y}`);

// ---- Coat and shoulders (not tilted) ----
path("M6 126C8 104 24 95 40 93L80 93C96 95 112 104 114 126Z", `fill="url(#red)"`);
const coat = out.splice(0);

// ---- Head, tilted a little ----
// Hat crown: as wide as the head, its tip drooping down the left side.
const crown = "M87 44C89 27 77 14 59 14C41 14 23 23 15 43L24 47C27 38 31 32 37 29C34.5 34 33 39 33 44Z";
path(crown, `fill="url(#red)"`);
path("M87 44C89 27 77 14 59 14C72 18 80 30 80 44Z", `fill="#7d0b14" opacity=".35"`); // shaded side
path("M37 29C42 24 50 21.5 58 21.5C49 24.5 41 30 36.5 37C36 34 36.2 31.5 37 29Z", `fill="#7d0b14" opacity=".4"`); // fold
path("M24 34C30 24 42 18 56 17.4C44 20 33 26 27 36Z", `fill="#fff" opacity=".16"`); // sheen
// Pompom
path(fluffy(ring(18, 48, 7.2, 8), [18, 48], 2.4), `fill="url(#fur)" stroke="${FUR_EDGE}" stroke-width="1"`);
path("M13.6 51.4q4.4 3.6 9 .4", `fill="none" stroke="${FUR_SHADE}" stroke-width="2.2"`);

// Hair and beard: one big fluffy shape, from the temples down.
const beard = [
  [33, 55], [27, 65], [26, 77], [29, 88], [36, 97], [46, 104], [60, 107],
  [74, 104], [84, 97], [91, 88], [94, 77], [93, 65], [87, 55],
];
path(fluffy(beard, [60, 75], 3.6, false) + "L33 55Z", `fill="url(#beard)" stroke="${FUR_EDGE}" stroke-width="1"`);
// Soft curls
path(
  "M31.5 66q2.4 4 .2 8M88.5 66q-2.4 4 -.2 8M35 81q3 5 .4 10M85 81q-3 5 -.4 10M45 95q4.5 3.6 9 0M66 95q4.5 3.6 9 0M54.5 101q5.5 3.4 11 0",
  `fill="none" stroke="${FUR_SHADE}" stroke-width="2"`,
);

// Face
path("M37 50C35 63 40 76.4 50 78.8C56 80.2 64 80.2 70 78.8C80 76.4 85 63 83 50C76 38 44 38 37 50Z", `fill="url(#skin)"`);

// Apple cheeks
raw(`<circle cx="42.6" cy="72.2" r="7.4" fill="url(#cheek)"/>`);
raw(`<circle cx="77.4" cy="72.2" r="7.4" fill="url(#cheek)"/>`);
raw(`<ellipse cx="40.8" cy="69.8" rx="2" ry="1.3" fill="#fff" opacity=".45"/>`);
raw(`<ellipse cx="79" cy="69.8" rx="2" ry="1.3" fill="#fff" opacity=".45"/>`);

// Soft shadow the brim casts on the forehead
path("M36.8 51.6C46 44.4 74 44.4 83.2 51.6L83 55.4C74 49.6 46 49.6 37 55.4Z", `fill="${LINE}" opacity=".16"`);

// THE WINK: his right eye (our left) crinkled shut, with gentle laugh lines.
path("M42.6 66.4Q48.2 60.4 53.8 66.4", `fill="none" stroke="${LINE}" stroke-width="2.6"`);
path("M40.4 64.4l-2.4 -1.3M40 67l-2.6 .4", `fill="none" stroke="${LINE}" stroke-width="1.2" opacity=".7"`);

// The open eye: small, smiling and twinkling.
path("M66 64.2Q71.2 60.4 76.4 64.2Q71.2 67.4 66 64.2Z", `fill="#fff"`);
raw(`<circle cx="71.2" cy="63.8" r="2.7" fill="#3f78ad"/>`);
raw(`<circle cx="71.2" cy="63.8" r="1.5" fill="#2b1a12"/>`);
raw(`<circle cx="72.2" cy="62.8" r=".85" fill="#fff"/>`);
path("M65 64.4Q71.2 58.8 77.4 64.4", `fill="none" stroke="${LINE}" stroke-width="2.2"`);
path("M66.6 67.6Q71.2 69.4 75.8 67.6", `fill="none" stroke="#c98667" stroke-width="1.1"`); // smiling lower lid
path("M79.4 63l2.2 -1.1M79.6 65.4l2.4 .2", `fill="none" stroke="${LINE}" stroke-width="1.1" opacity=".55"`);

// Snowy brows: kindly, one relaxed over the wink and one lifted.
const browStyle = `fill="#fff" stroke="${FUR_EDGE}" stroke-width=".9"`;
path("M40.4 59.4C42.4 53.4 53 52.2 57.2 56.6C56.4 58.8 54.2 59 51.6 58.4C47.8 57.6 44 58.2 40.4 59.4Z", browStyle);
path("M63.2 56.4C66.6 49.6 78.6 49.6 81.6 56.2C77.6 55 71.6 55 66.8 57C65.4 57.6 63.8 57.4 63.2 56.4Z", browStyle);

// A gentle smile under the moustache
path("M53.4 83Q60 88.6 66.6 83", `fill="none" stroke="#9c3a2c" stroke-width="2"`);
path("M56.6 87.6Q60 89.4 63.4 87.6", `fill="none" stroke="#e7b9a0" stroke-width="1.6"`);

// Moustache: two sweeping lobes with curled tips, with a soft shadow beneath
const lobe = "M60 74C54 70 42 71 36 78C34 80.5 31 80 30 78C30.5 84 37 86.5 43 84.5C50 82.5 56 80 60 76.5Z";
for (const d of [lobe, mirror(lobe)]) {
  out.push(`<path d="${d}" fill="${LINE}" opacity=".14" transform="translate(0 2.2)"/>`);
  path(d, `fill="url(#fur)" stroke="${FUR_EDGE}" stroke-width="1"`);
}
path("M39.5 79.6C45 76.8 51 76.4 56.5 77M80.5 79.6C75 76.8 69 76.4 63.5 77", `fill="none" stroke="${FUR_SHADE}" stroke-width="1.6"`);

// Rosy nose
raw(`<ellipse cx="60" cy="70.6" rx="5.9" ry="5.2" fill="url(#nose)"/>`);
raw(`<ellipse cx="58" cy="68.6" rx="1.9" ry="1.3" fill="#fff" opacity=".7"/>`);

// Fur brim wrapping the forehead
const brim = "M31 40C40 30 80 30 89 40C92.5 43 92.5 48.4 89 51.4C80 44.6 40 44.6 31 51.4C27.5 48.4 27.5 43 31 40Z";
path(brim, `fill="url(#fur)" stroke="${FUR_EDGE}" stroke-width="1"`);
path("M31 51.4C40 44.6 80 44.6 89 51.4C90.4 50.2 91.1 49 91.4 47.6C80 41.6 40 41.6 28.6 47.6C28.9 49 29.6 50.2 31 51.4Z", `fill="${FUR_SHADE}"`);
path("M42 38.6q2.2 -2.2 4.4 0M57.6 35.8q2.2 -2.2 4.4 0M73 38.2q2.2 -2.2 4.4 0", `fill="none" stroke="${FUR_SHADE}" stroke-width="1.8"`);
const head = out.splice(0);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <!-- The Nice List's mark: a warm, classic mid-century American style winking Santa. Original
       artwork, generated by scripts/santa-svg.mjs; also copied to src/app/icon.svg (tab icon). -->
  <defs>
    <clipPath id="badge"><circle cx="60" cy="60" r="55"/></clipPath>
    <radialGradient id="bg" cx=".5" cy=".42" r=".62">
      <stop offset="0" stop-color="#2a7a50"/><stop offset="1" stop-color="#0d3a24"/>
    </radialGradient>
    <linearGradient id="red" x1=".15" y1="0" x2=".85" y2="1">
      <stop offset="0" stop-color="#e5343c"/><stop offset="1" stop-color="#b3101e"/>
    </linearGradient>
    <linearGradient id="fur" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f1eadd"/>
    </linearGradient>
    <radialGradient id="beard" cx=".5" cy=".3" r=".75">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ebe3d3"/>
    </radialGradient>
    <radialGradient id="skin" cx=".5" cy=".55" r=".6">
      <stop offset="0" stop-color="#fcd6b6"/><stop offset="1" stop-color="#f0ac84"/>
    </radialGradient>
    <radialGradient id="cheek">
      <stop offset="0" stop-color="#ee5f55" stop-opacity=".8"/><stop offset="1" stop-color="#ee5f55" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="nose" cx=".4" cy=".35" r=".7">
      <stop offset="0" stop-color="#f6a391"/><stop offset="1" stop-color="#dd6355"/>
    </radialGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#bg)"/>
  <g clip-path="url(#badge)" stroke-linejoin="round" stroke-linecap="round">
    ${coat.join("\n    ")}
    <g transform="rotate(-4 60 70)">
      ${head.join("\n      ")}
    </g>
  </g>
  <circle cx="60" cy="60" r="56" fill="none" stroke="#d9a521" stroke-width="4.4"/>
  <circle cx="60" cy="60" r="58.8" fill="none" stroke="#8a6a12" stroke-width="1"/>
</svg>
`;
fs.writeFileSync(new URL("../public/santa.svg", import.meta.url), svg);
fs.writeFileSync(new URL("../src/app/icon.svg", import.meta.url), svg);
console.log("written");
