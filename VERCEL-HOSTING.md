# Vercel hosting and your domain

TohfaNote is created by [Handmade Gifts Delhi](https://www.instagram.com/handmadegiftsdelhi/).

**Status:** this source runs with the supplied local Node server or the Cloudflare Worker/R2 package. A complete Vercel backend migration is not implemented or verified. No new deployment was made during recovery.

## What the backend and scripts do

`server/api.mjs` exports the shared gift API. It validates gifts/photos, creates random gift IDs and management keys, stores only management-key hashes, enforces scheduled access, serves photos, authorizes edits/deletion, checks update revisions, and sets safe response headers. It does not start a server itself. Its `r2Store` adapter expects a Cloudflare Worker R2 binding.

| File | Role |
| --- | --- |
| scripts/dev.mjs | Build and start the local app; no hot reload |
| scripts/serve.mjs | Long-running Node HTTP server for the exported frontend and gift API |
| scripts/storage.mjs | Private local JSON storage in DATA_DIR, with atomic replacements |
| scripts/package.mjs | Package exported frontend plus API as a Cloudflare Worker |

`npm start` starts the custom Node server. Importing this source unchanged into Vercel does not automatically run that server or the Cloudflare Worker.

## Required Vercel changes

1. Remove `output: 'export'` from next.config.ts for a native Next.js API build. Expose GET/POST/PUT/DELETE through a Node Route Handler such as app/api/gifts/[[...path]]/route.ts, calling the shared API. Use next build rather than the Cloudflare packaging step for Vercel.
2. Implement durable external storage. Never use local DATA_DIR as a persistent Vercel database. R2 can be used through its S3-compatible API, but the current env.BUCKET Worker binding will not exist on Vercel. Another private storage/database provider can replace Cloudflare.
3. Rework image transfer or lower complete-gift limits. Vercel Functions cap request and response payloads at 4.5 MB; this app permits an 8 MiB request and returns embedded photo data in management responses. A robust design uploads separate image objects through short-lived signed URLs and stores references, with authenticated upload completion/deletion and access enforcement before the scheduled opening. A smaller first version could cap the entire serialized gift well below 4.5 MB. Raising a Next.js body setting cannot override the platform limit.
4. Add server-side storage secrets through Vercel settings, never NEXT_PUBLIC_. Proposed names for an R2 adapter: R2_ENDPOINT, R2_BUCKET_NAME, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY. These are proposed configuration names, not a working integration in this repository. Use a bucket-scoped token and origin-restricted CORS if implementing direct uploads.
5. Push to your own Git repository and import the actual app folder into Vercel as Next.js. Use npm ci and the revised next build command with Vercel's default Next.js output handling. Do not choose out/ when using native API routes.
6. Verify publishing, real photos, separate-device opening, scheduled access, editing/deletion, large payloads, and persistence through redeployment before advertising a working Vercel integration.
7. In Vercel Settings → Domains, add your purchased domain and use the exact DNS records shown in your DNS provider. Add www/choose the primary domain as desired, wait for verification/HTTPS, then retest gift sharing. New links derive from location.origin.

Moving source code does not move existing gifts. Local data/, the currently hosted R2 bucket and a new hosting storage account are separate unless deliberately migrated. Preserve gift IDs, token hashes and photos when migrating. Reusing the existing Sites-provisioned bucket requires actual authorized access and cannot be assumed. Previously sent URLs need the old hostname or deliberate redirects; management-link origin validation must also be addressed during a domain migration.

## Free use and ongoing operation

Cloudflare is optional: the app needs durable storage and an API somewhere. Free allowances may support a small launch, but unlimited free storage/traffic is not guaranteed. Custom domains have their own renewal costs. Vercel Hobby is restricted to personal non-commercial use; a free-to-customers business product is not automatically non-commercial. Keep accounts active, monitor usage/errors, retain private backups and apply security updates. The app currently has no automatic gift expiry.

Official references checked 10 November 2026:

- https://nextjs.org/docs/app/guides/backend-for-frontend
- https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions
- https://vercel.com/docs/functions/limitations
- https://vercel.com/docs/domains/set-up-custom-domain
- https://vercel.com/docs/plans/hobby
- https://developers.cloudflare.com/r2/pricing/
