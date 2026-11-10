# TohfaNote

**Har tohfe mein dil ki baat.** Personalized digital gifts and surprises, created by [Handmade Gifts Delhi](https://www.instagram.com/handmadegiftsdelhi/). Intended domain: https://tohfanote.live. Preferred social handle: @tohfanote.

## Privacy upgrade

See **PRIVACY-UPGRADE.md before deploying**. This release adds recipient passcodes, durable attempt limits, revocable links, management-key rotation, a 30-day maximum retention period, private-page security headers/CSP, draft clearing, new footer/policies and share-page creator actions. Add SESSION_SECRET and CRON_SECRET in Vercel before rollout, run the one-time legacy migration, and monitor daily cleanup.

## Run locally

Use Node.js 22.13+ (verified with 24.11.1) and npm.

```bash
npm ci
npm run dev
```

For a production build:

```bash
npm run build
npm start
```

Open http://localhost:3000. These are now standard Next.js commands, including a working API; no separate custom HTTP server or Worker is required. Local development without R2 variables uses private JSON files under data/. Add `GIFT_STORAGE=local` to .env.local to explicitly use local files even when local R2 settings are present. Never use that setting on Vercel: the hosted API refuses filesystem storage.

## Vercel setup

1. Push this version to your Git repository when you are ready for its connected deployment to run.
2. Vercel Framework Preset: **Next.js**. Root Directory: the folder containing this package.json. Install: `npm ci`. Build: `npm run build`. Reset any old output override such as `out` or `dist`; Next.js uses `.next`. vercel.json also declares this configuration.
3. Add the following **server-only** environment variables to the Production environment and to Preview if you will test a branch preview:

| Variable | Value |
| --- | --- |
| R2_ENDPOINT | Account-level HTTPS S3 endpoint, e.g. https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com; no bucket path |
| R2_BUCKET_NAME | Your private bucket, e.g. tohfanote-gifts |
| R2_ACCESS_KEY_ID | Access Key ID of your R2 S3 credentials |
| R2_SECRET_ACCESS_KEY | Corresponding Secret Access Key |
| SESSION_SECRET | New random secret, at least 32 characters; unlock sessions and hashed attempt identifiers |
| CRON_SECRET | Different random secret, at least 32 characters; scheduled cleanup authorization |

Use Object Read & Write permission restricted to that bucket. Do not use a general Cloudflare API bearer token instead of the S3 key pair. Do not prefix these names with NEXT_PUBLIC_, commit values to Git, or share them in screenshots/chat. The app does not need public r2.dev access, a public bucket domain, or bucket CORS: all storage requests are server-to-server.

4. Redeploy after adding/changing variables; running deployments do not pick up dashboard changes automatically.
5. Test the full gift flow on the deployed URL. New gift links use the current browser origin, so a visit to tohfanote.live creates links on that domain; preview links stay on the preview origin.

No secret values are included in this repository. The real R2 bucket has not been verified from this development session because its credentials exist only in your Vercel account. Read VERCEL-HOSTING.md for diagnosis and post-deployment checks.

## What fixed the 404

`app/api/gifts/[[...path]]/route.ts` now registers a dynamic Node API route for both /api/gifts and its gift/photo/management subpaths. `output: 'export'` was removed. The API reads the four R2 environment variables through the official S3 SDK. The old Cloudflare Worker manifest and custom serving/packaging scripts were removed from this Vercel branch.

Both /api/gifts and /api/gifts/ resolve (Next.js may redirect to its canonical trailing-slash form). If storage configuration is missing, the API returns an actionable JSON 503 rather than a static HTML 404. Bad R2 permissions/connectivity return a safe storage error; credentials and SDK error bodies are never exposed in responses.

## Storage, privacy and limits

Published gifts are private R2 JSON records under gifts/<192-bit-random-id>.json. Each record includes resized photos, names, letter, occasion/theme/music, schedule, timestamps, revision, and a SHA-256 hash of a separate 256-bit management key. Optional passcodes use salted scrypt hashes; recipient links and management keys can be rotated. Full records are not publicly served; recipient responses omit the key/hash and use protected photo endpoints. No gift listing endpoint exists. Anyone with a current recipient link can view/forward/download the gift after opening unless a recipient passcode is required; anyone with the secret management link can edit/delete it. This is link privacy, not end-to-end encryption. Lost management keys cannot be recovered.

Only drafts use browser localStorage. Local filesystem gifts and R2 gifts are separate. Neither Git nor this source ZIP contains private gift records. Moving source does not migrate gifts between storage accounts. Existing R2 records that follow the earlier format retain their IDs/key hashes; no schema migration is needed for ordinary records. Exception: unusually large legacy records may exceed the new editor response limit and require owner-assisted resizing or protected deletion.

Up to six photos, each original at most 12 MB. The browser resizes JPEGs to at most 1000px and progressively reduces quality/dimensions to at most 350,000 data-URL characters per photo. The API caps complete requests and JSON responses at 3 MiB, below Vercel's 4.5 MB function payload limit. Six maximum-size optimized photos still fit in the editor response. Older local draft photos are optimized automatically on publish. Images remain embedded in one gift record, so deletion removes them with the gift. This initial version uses bounded uploads through the API rather than public/direct browser-to-R2 uploads.

Scheduled access is checked on the server: early recipients get only the opening instant/timezone, and photo endpoints are sealed too. Scheduling does not send WhatsApp/email messages. Creator previews and authorized management are available before opening. Dates use explicit IANA timezones and reject ambiguous/nonexistent daylight-saving times in the builder.

Publication and passcode attempt counters now use durable conditional storage records. They are not a complete global denial-of-service or abuse prevention service. The Vercel adapter uses the platform client-IP header for its key. For higher traffic, add platform rate controls, storage budgeting, retention policy, and private backups. New gifts expire within 30 days; a protected daily job removes expired stored content. Physical cleanup can be delayed by failed jobs. See PRIVACY-UPGRADE.md for legacy migration and operational requirements.

## Code map

| File | Purpose |
| --- | --- |
| app/api/gifts/[[...path]]/route.ts | Native Next.js Node route, dynamic/non-cached |
| server/next-handler.mjs | Select storage, handle configuration errors, provide trusted Vercel client-IP context |
| server/api.mjs | Validation, publication, scheduling, authorization, photos, edit conflict checks and deletion |
| server/s3-store.mjs | R2 S3 credentials/configuration and signed SDK storage requests |
| server/storage.mjs | Lazy storage selection; no credential/network requirement during frontend build |
| scripts/storage.mjs | Local-only JSON adapter with atomic replacement |
| scripts/check-r2.mjs | Optional private local R2 connection/lifecycle check |
| lib/limits.mjs | Shared photo/request/response budgets |

## Verification

```bash
npm run check
npm test
# With the production server running, e.g. PORT=3100 npm start:
TEST_ORIGIN=http://localhost:3100 npm run test:browser
```

Browser tests use an installed Chrome/Chromium (`CHROME_PATH`, default /usr/bin/google-chrome) and publish/delete synthetic records on the selected test origin. They should run against a local instance first. They cover independent mobile browser reopening, uploads (including a detailed/noisy image), previews, publishing, clipboard/WhatsApp URL, edit/delete confirmation, schedules and all seven occasions. The backend suite includes a local S3-compatible fixture that checks real SDK request signing, key paths, conditional write headers, permission errors and deletion. A fixture is not proof of a real account's credentials or permissions.

To verify your own real R2 credentials privately, create .env.local from .env.example with the four R2 values and SESSION_SECRET, then run:

```bash
npm run storage:check
```

This writes, reads, conditionally edits and deletes one synthetic gift. It prints no credentials or management links. It is optional and was not run against your real bucket in this session.

See VERCEL-FIX-VERIFICATION.md for actual results. Older REFERENCE-ANALYSIS.md, RECOVERY.md and VERIFICATION.md retain historical observations, not current deployment status.
