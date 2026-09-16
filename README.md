# Clique Studios

Corporate website for Clique Studios LLC, served at https://cliquestudios.org by Cloudflare Workers Static Assets.

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
