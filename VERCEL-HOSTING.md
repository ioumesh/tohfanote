# TohfaNote: Vercel + private Cloudflare R2

The Vercel backend is now implemented in this branch. It has been tested locally, including signed S3 fixture requests. It has not been deployed or tested with your real R2 credentials yet.

## Exact Vercel settings

- Framework: Next.js
- Root Directory: repository folder with package.json
- Install Command: npm ci
- Build Command: npm run build
- Output: Next.js default (.next); clear old out/dist overrides
- Production environment variables: R2_ENDPOINT, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
- Add SESSION_SECRET and CRON_SECRET (different random values, at least 32 characters) before deploying this privacy release. Read PRIVACY-UPGRADE.md and run the one-time legacy gift migration.
- Add the same variables to Preview if the branch preview needs to create gifts
- GIFT_STORAGE=local is forbidden on Vercel; remove any old setting of that value
- Redeploy after environment/build-setting changes

No PUBLIC_ORIGIN, NEXT_PUBLIC_ credential, R2 public URL, Worker BUCKET binding, SQL database, or R2 browser CORS is required for this implementation. Shared links use the origin of the page being visited. Your domain can remain mapped to the same Vercel project.

## Cloudflare settings

Create or select a **private** R2 bucket. The R2 S3 credentials need Object Read & Write for that exact bucket, including reading, creating, conditional editing and deletion. Copy the Access Key ID and Secret Access Key, not the generic API token text. R2_ENDPOINT is the account S3 endpoint with no bucket path. Standard and jurisdiction-specific eu/fedramp account endpoint hosts are admitted. Never put credentials in client-side variables or source files.

## Diagnose errors

| Result from publishing | Meaning/action |
| --- | --- |
| HTML 404 for POST /api/gifts/ | Old deployment or wrong static/output/framework/root settings; deploy the commit that adds the Next.js route |
| JSON 503 listing missing R2 variables | Set those variables in the environment actually serving that URL, then redeploy |
| JSON 503 reporting endpoint/bucket format | Use the account-level S3 endpoint and plain bucket name |
| JSON 503 storage unavailable | Check key pair, correct account/bucket, Object Read & Write scope, expiration and connectivity; server logs only sanitized error names/statuses |
| JSON 413 gift too large | The app's 3 MiB total budget was exceeded; use fewer/smaller photos |
| JSON 403 management key | Use the private management link belonging to that gift; recipient links cannot authorize editing |
| JSON 409 gift changed | Another editor saved first; reload the management link before retrying |

The new production build must list a dynamic route: ƒ /api/gifts/[[...path]]. The route handles canonical slash redirects, so both slash forms are supported by fetch. A bare GET /api/gifts is not a public listing or a connection health test.

## Before announcing the site as working

1. Confirm a successful Vercel build for this commit with the dynamic API route.
2. Publish a small synthetic Birthday gift with a real photo.
3. Open the generated link in another browser/device with no creator storage; ensure the photo loads.
4. Use the separate management link to edit; confirm the recipient URL stays the same.
5. Cancel a deletion, then confirm deletion; recipient and image links must stop working.
6. Test scheduling before and after the selected instant and confirm creator management still works.
7. Redeploy once and reopen a saved synthetic gift to confirm persistence; clean it up afterward.
8. Retest from https://tohfanote.live, not only a branch preview hostname.

Preview deployment protection may require login and interfere with cross-device testing. Production visitors need access appropriate to your intended public gift links. No domain/DNS access changes were performed by this code update.

## Remaining operational choices

The product stays free for recipients, but hosting/storage allowances and commercial-plan rules are separate. Monitor usage, retain private backups and decide a retention/backup policy. Durable attempt limits protect passcodes and creation; use platform/global abuse controls before larger public traffic. Do not delete the bucket during deployments.

For large-scale or high-resolution gifting, separate photo objects with signed direct uploads are a future extension. This release keeps the existing record format and six-photo flow using stricter automatic compression and a 3 MiB request/response cap, which addresses Vercel's current payload limits without exposing a public bucket.

Official sources checked 10 November 2026:

- [Next.js backend route handlers](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [Vercel function payload limits](https://vercel.com/docs/functions/limitations)
- [R2 S3 support and conditional PutObject operations](https://developers.cloudflare.com/r2/api/s3/api/)
