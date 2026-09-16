# Clique Studios

Corporate website for Clique Studios LLC, served at https://cliquestudios.org by Cloudflare Workers Static Assets.

## Typefaces

Figtree (body) is self-hosted through `next/font/google`. Fraunces sets only the wordmark, so `src/app/fonts/fraunces-wordmark.woff2` is a 4 KB glyph subset of the variable font (with its optical-size axis) loaded through `next/font/local`; regenerate it from the Google Fonts CSS API with `text=Clique%20Studios` if the wordmark's letters ever change. No requests go to Google at runtime.

## Inks

The whole page is printed with four drums: Fluorescent Pink `#ff48b0`, Blue `#0078bf`, Yellow `#ffe800`, and Black `#1b1917` (`INKS` in `src/components/cast.ts`). Every other color is an overlap: each pass is a separate layer that multiplies over the one below and lands a hair off. Pip is yellow with a blue pass, Nib is yellow with a pink pass, the orange and red marks are pink and yellow together.

## The characters

Five ink creatures wander the page (`src/components/Blobs.tsx`). Their shapes, faces, colors, and personalities live in `src/components/cast.ts`; the physics and state machine (wander, hop, nap, greet, chase, startle, sulk, celebrate, grab and throw) live in the component. The DOM is written 24 times a second, with the outline boil re-rolled at 12, for a stop-motion feel. The risograph look comes from the tokens at the top of `src/app/globals.css`: paper tooth, ink speckle and pinhole masks, misregistration offsets, and wobbly `clip-path` polygons for the cut edges of the note and tape. The characters' rough edges are drawn into the outline geometry itself (`roughOutline` in `cast.ts`). There are no SVG `filter: url()` references on the page on purpose: WebKit re-runs them on the CPU every time a filtered element changes (that alone cost half the frames on an iPhone), and iOS Safari drops the reference after a tab restore, which made the wordmark vanish.

## Performance

The animation is DOM and SVG only. Physics runs each frame; DOM writes happen 24 times a second through a dirty-checking `set()`, and the loop stops while the tab is hidden. Measured on the iPhone simulator at 3x: 60 fps with a 99th-percentile frame of 20 ms (it was 28 fps with 26% of frames over 20 ms before the edge filter moved into geometry). On a throttled 4G / 4x-CPU Chrome profile the page transfers about 190 KB and paints in about 0.6 s.

In development, `/#perf` shows a frame-time readout after five seconds; add flags to switch effects off for A/B runs: `/#perf,nofilter,noblend,nomask,notooth,nowc,nostatic`.

`public/_headers` gives the hashed build output under `/_next/static/` a one-year immutable cache.

## Development and deployment

Use Node.js 24 and the checked-in npm lockfile:

```sh
npm ci
npm run dev
npm run lint
npm run build
npm start
```

`build` exports the Next.js site to `out/`. `start` serves that export in Wrangler. `preview` builds and starts Wrangler in one command. No server-side Next.js runtime or application secrets are required.

Deploy with an authenticated Cloudflare account:

```sh
npm run deploy
```

`wrangler.jsonc` owns the Worker, static assets, and the apex and www custom domains. The Cloudflare zone also has a Single Redirect rule named `Canonical www to cliquestudios.org`: HTTPS requests to www redirect to the apex with status 301, preserving path and query string.

The registrar remains Porkbun. Authoritative nameservers are `aisha.ns.cloudflare.com` and `memphis.ns.cloudflare.com`. Google Workspace MX, SPF, DKIM, DMARC, and verification records remain in Cloudflare DNS.

## Migration verification

The Cloudflare migration was checked with a production export, ESLint, local Wrangler smoke checks (home 200, assets 200, missing route 404), a desktop visual check, and mobile layout geometry at 390px with no horizontal overflow. The existing contact link remains `mailto:hi@cliquestudios.org`.

The previous Netlify deployment remains available for rollback. Reverting hosting requires replacing the two Worker custom domains with the previous DNS records: apex A `99.83.231.61` and `75.2.60.5`, and www CNAME `cliquestudios.netlify.app`. Preserve mail DNS. Disable the Cloudflare www redirect only if its replacement provides that redirect.
