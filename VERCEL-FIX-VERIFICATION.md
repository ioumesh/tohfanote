# Vercel API fix — verification

Prepared against the user-supplied GitHub repository https://github.com/ioumesh/tohfanote at base commit 90db4eeedcab591f27b8371ec440a23abc7131d5. This document records local verification, not a deployment or a real-bucket integration claim.

## Implemented

- Native dynamic Node route for /api/gifts and all gift/photo/management subpaths.
- Native Next.js dev/build/start scripts; static-export mode, legacy Worker manifest and custom HTTP/Worker packaging removed.
- Official S3 SDK R2 adapter consuming R2_ENDPOINT, R2_BUCKET_NAME, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.
- Private object reads/writes/deletion with conditional create/update headers and safe error handling; no filesystem fallback on Vercel.
- Six automatically optimized photos within a 3 MiB request and JSON-response budget; automatic optimization of larger older local draft photos during publish.
- Actionable JSON errors for missing configuration and safe errors for access failures. Non-JSON failures no longer surface as a JSON parsing exception.
- Correct Vercel framework/build/output configuration and complete setup instructions.

## Checks passed

- TypeScript check and Next.js production build.
- Build output registers ƒ /api/gifts/[[...path]], not a static API page.
- All 11 backend tests: storage lifecycle/auth/deletion; schedules; validation/security/error handling; all occasions; maximum six-photo request/editor response budgets and oversized rejection; three IANA/DST cases; hosted missing-configuration response; hosted filesystem rejection/config validation; official SDK signed S3 fixture requests, 404/403/412 classification, conditional writes, and deletion.
- All 18 grouped desktop/mobile browser checks passed against the native production Next.js server at localhost:3100. These include creation, photos (including noisy high-detail input), theme/music, draft restoration, preview, publishing, clipboard/WhatsApp URL, opening in an independent mobile browser without creator storage, protected management, edit, cancellation of deletion, permanent deletion, scheduled unlock, all seven occasions and puzzle completion. No browser JavaScript errors were recorded.
- A second local Next.js instance with VERCEL=1 and no R2 variables returned JSON 503 with setup guidance for POST /api/gifts and POST /api/gifts/, rather than the screenshot's static HTML 404. It did not write local gift records.

The S3 fixture uses synthetic credentials and a local server; it proves transport/signing/header/error behavior, not the validity of the owner's Cloudflare account or keys. No real R2 credentials were accessed. The optional npm run storage:check command lets the owner verify the real key pair privately. Public-bucket access and browser CORS are not required.

## Deployment boundary

No branch/main push or Vercel deployment was made while preparing this fix. The repository is connected to Vercel, so a push may trigger a deployment and needs the user's instruction. After deploying, verify real R2 persistence, photo loading and editing/deletion on the actual preview/production environment. Ensure the four variables are set in the environment for the URL being tested, clear old out/dist settings, and redeploy after changes.

Previously committed screenshot PNGs are retained as historical UI examples; this fix's fresh machine-readable browser run is tests/results/browser-results.json. No private data/ records or environment values are included in the source.
