# TohfaNote

**Har tohfe mein dil ki baat.** Personalized digital gifts and surprises, created by [Handmade Gifts Delhi](https://www.instagram.com/handmadegiftsdelhi/). Intended domain: https://tohfanote.live. Preferred social handle: @tohfanote.

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

No secret values are included in this repository. The real R2 bucket has not been verified from this development session because its credentials exist only in your Vercel account.

## What fixed the 404

`app/api/gifts/[[...path]]/route.ts` now registers a dynamic Node API route for both /api/gifts and its gift/photo/management subpaths. `output: 'export'` was removed. The API reads the four R2 environment variables through the official S3 SDK. The old Cloudflare Worker manifest and custom serving/packaging scripts were removed from this Vercel branch.

Both /api/gifts and /api/gifts/ resolve (Next.js may redirect to its canonical trailing-slash form). If storage configuration is missing, the API returns an actionable JSON 503 rather than a static HTML 404. Bad R2 permissions/connectivity return a safe storage error; credentials and SDK error bodies are never exposed in responses.

## Storage, privacy and limits

Published gifts are private R2 JSON records under gifts/<192-bit-random-id>.json. Each record includes resized photos, names, letter, occasion/theme/music, schedule, timestamps, revision, and a SHA-256 hash of a separate 256-bit management key. Optional passcodes use salted scrypt hashes; recipient links and management keys can be rotated. Full records are not publicly served; recipient responses omit the key/hash and use protected photo endpoints. No gift listing endpoint exists. Anyone with a current recipient link can view/forward/download the gift after opening unless a recipient passcode is required; anyone with the secret management link can edit/delete it. This is link privacy, not end-to-end encryption. Lost management keys cannot be recovered.

Only drafts use browser localStorage. Local filesystem gifts and R2 gifts are separate. Neither Git nor this source ZIP contains private gift records. Moving source does not migrate gifts between storage accounts. Existing R2 records retain their URLs and key hashes. Follow the retention migration below for existing gifts. Exception: unusually large legacy records may exceed the new editor response limit and require owner-assisted resizing or protected deletion.

Up to six photos, each original at most 12 MB. The browser resizes JPEGs to at most 1000px and progressively reduces quality/dimensions to at most 350,000 data-URL characters per photo. The API caps complete requests and JSON responses at 3 MiB, below Vercel's 4.5 MB function payload limit. Six maximum-size optimized photos still fit in the editor response. Older local draft photos are optimized automatically on publish. Images remain embedded in one gift record, so deletion removes them with the gift. This initial version uses bounded uploads through the API rather than public/direct browser-to-R2 uploads.

Scheduled access is checked on the server: early recipients get only the opening instant/timezone, and photo endpoints are sealed too. Scheduling does not send WhatsApp/email messages. Creator previews and authorized management are available before opening. Dates use explicit IANA timezones and reject ambiguous/nonexistent daylight-saving times in the builder.

Publication and passcode attempt counters now use durable conditional storage records. They are not a complete global denial-of-service or abuse prevention service. The Vercel adapter uses the platform client-IP header for its key. For higher traffic, add platform rate controls, storage budgeting, retention policy, and private backups. New gifts expire within 30 days; a protected daily job removes expired stored content. Physical cleanup can be delayed by failed jobs.

## 30-day retention

New gifts expire at most 30 days after publication. Creators may choose an earlier expiry. Edits and link/key changes do not extend the maximum. Opening must happen before expiry.

Before expiry, creator management works even while the recipient link is disabled or scheduled. At expiry, recipients receive no letter/photos. Expired management shows only minimal information and a deletion option, rather than exposing expired content.

Deletion replaces the live gift with a minimal tombstone first, removing its content and revoking access atomically, then removes the record/link. A failed final deletion can leave non-content metadata for cleanup; it does not leave the letter/photos in that live record.

A daily Vercel cron at 03:00 UTC calls /api/maintenance/cleanup/ with CRON_SECRET. API access expiry is exact; physical cleanup follows a successful job and can be delayed by outages or bounded processing. Monitor failures/pending results and retry. Backups, provider retention and recipient copies are not erased by the application.

## Existing gifts: migration

The first privacy initialization writes one immutable activation timestamp under settings/privacy-v1 in the private bucket. Legacy gifts keep their original URLs and management-key hashes and receive 30 days from that timestamp. Their deadline does not keep extending on later visits.

For a complete rollout, run `npm run privacy:migrate` once using your private local .env.local with the four R2 variables and SESSION_SECRET. It reads/indexes all existing gifts without printing contents or keys. This establishes deadlines for dormant gifts too. It was not run against your real account in this session. The daily job also migrates legacy records in resumable batches of 25 as a fallback; large existing collections should use the one-time command before announcing the retention policy.

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

1. Confirm a successful Vercel build for the intended revision with the dynamic API route.
2. Publish a small synthetic Birthday gift with a real photo.
3. Open the generated link in another browser/device with no creator storage; ensure the photo loads.
4. Use the separate management link to edit; confirm the recipient URL stays the same.
5. Cancel a deletion, then confirm deletion; recipient and image links must stop working.
6. Test scheduling before and after the selected instant and confirm creator management still works.
7. Redeploy once and reopen a saved synthetic gift to confirm persistence; clean it up afterward.
8. Retest from https://tohfanote.live, not only a branch preview hostname.

Preview deployment protection may require login and interfere with cross-device testing. Production visitors need access appropriate to your intended public gift links. No domain/DNS access changes were performed by this code update.

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

Browser tests use an installed Chrome/Chromium (`CHROME_PATH`, default /usr/bin/google-chrome) and publish/delete synthetic records on the selected test origin. They should run against a local instance first. They cover independent mobile browser reopening, uploads (including a detailed/noisy image), previews, publishing, clipboard, WhatsApp and email sharing, edit/delete confirmation, schedules and occasion-specific gift flows. The backend suite includes a local S3-compatible fixture that checks real SDK request signing, key paths, conditional write headers, permission errors and deletion. A fixture is not proof of a real account's credentials or permissions.

To verify your own real R2 credentials privately, create .env.local from .env.example with the four R2 values and SESSION_SECRET, then run:

```bash
npm run storage:check
```

This writes, reads, conditionally edits and deletes one synthetic gift. It prints no credentials or management links. It is optional and was not run against your real bucket in this session.

## Gift flows and accessibility

Choose an occasion, write a letter, add optional photos, and select appearance, music and opening time. Preview before publishing. Keep the private management link to edit, delete, disable or regenerate the recipient link, or rotate the management key. Anonymous gifts store “Someone special” in place of the sender name. Draft settings stay in the browser and **Clear draft** removes them. The recipient passcode display supports typing and paste.

The interface uses scalable typography, 16px default body and form text, and at least 14px for supporting text. Run `node tests/typography.mjs` and `node tests/mobile-refinements.mjs` against the local server using `TEST_ORIGIN` for enlarged-text, spacing and mobile layout checks. The privacy browser suite uses the fixture cron secret from its test file.

Contact [TohfaNote support](mailto:umesh.devcraft@gmail.com). The public OurMoments reference informed the envelope and gift-building flow. TohfaNote uses its own branding, copy and artwork.


## KoiKoi reference

REA captured the public [homepage](https://koikoiapp.com/), [birthday builder](https://koikoiapp.com/birthday), [Diwali builder](https://koikoiapp.com/diwali), and [order history](https://koikoiapp.com/order-history). The homepage describes birthday balloons, festive lights, a Bhai Dooj thali, previews, private links and paid gift packs. The birthday and Diwali builders displayed guided first steps. The public order history displayed an empty state, so signed-in recovery behavior was unverified.

TohfaNote uses its existing builder and publishing flow for Diwali and Bhai Dooj. Recipients can light three diyas, prepare a thali, or pop birthday balloons to reveal original wishes. The interactions work in preview and published gifts and reset on replay. These gifts use the app’s free sharing and existing expiry and management controls.

REA evidence IDs:

- Homepage: `ev_ee436abc1e46d706963a268a730f2acf3e22f8e53636b79283f506411e1e4947`
- Birthday: `ev_14e7c2110e8d54bf8df5c984051d0b1bb19122c4bc70ec24a3352c424ebc2e7e`
- Diwali: `ev_4318d433cc4a3a2053fcde759d2e487dcd941a394e4ccb3715bfc96cc005cb79`
- Order history: `ev_5d60134abb58078bab9bed7bdec97f9a04e8d82bbb155ecd976d7f041894f0f7`

### Public builder walkthrough

The REA follow-up covered the homepage's eight linked builders, the card directory, both pack pages, the blog, and the public order-history entry. A Chrome follow-up advanced the festival forms with synthetic names and followed the two additional catalog pages into their public builders. Checkout, private account history, and post-purchase sharing remain unverified.

| KoiKoi card | Public behavior observed | TohfaNote implementation |
| --- | --- | --- |
| Birthday | Relationship, names and optional age, then a cake chooser | Cake colours follow the selected palette, plus candles and three editable balloon wishes |
| Proposal | Relationship and names lead to an editable question | Custom question inside the existing proposal reveal |
| Apology | Names lead to a question about what happened | Letter prompt covers the event, its effect, and what will change |
| Love | Recipient prompts lead to three short notes and a longer letter | Optional private reasons revealed one at a time, plus the letter |
| Diwali | Audience and names lead to three editable notes | Three diyas with editable wishes |
| Favourite Light | Names lead to three editable notes | Lanterns reveal personal notes and the first three uploaded photos |
| Bhai Dooj | Sibling and names, bond, three editable notes, optional photos, then public preview | Dedicated four-step builder and a staged thali, notes and instant-print finale |
| Dhanteras | Audience and names lead to optional photos for a passbook | A three-step planting interaction, optional wishes, and the existing photo gallery |
| Garba | Builder asks who the invitation is for and both names. Catalog describes event details and a ticket-style reveal. | An invite with optional reason, venue, and date/time reveals |
| Navratri blessings | Builder asks whether the blessing is for family or friends. Catalog describes personal wishes and a devotional moment. | Personal blessings revealed by lighting diyas |

The builder uses three steps: Write, Photos, and Review. Every occasion has its own letter prompt. Reveal notes and review settings expand only when needed. Cards publish through TohfaNote's free sharing flow.

Additional REA evidence:

- Catalog: `ev_b4fee94c5e54d3a6b580ad98755934e8a944bab18c89793f69b48b71833fb55a`
- Birthday cake: `ev_b08bb3063df136f1ad11a8b832b285126f05539125b0e5ba0e90dd8cc0673090`
- Proposal question: `ev_8df60e11443921f1c0a5e1f1c539b1b2253b71a43cc353e96e31c21801563785`
- Apology prompts: `ev_c31aa5c79525e7285d879821281d96ac4cdec6e99faf429a443c77bdc806ed08`
- Love notes: `ev_ed02c86e47ed30c5b263f32e57607fdd8110a9b76baad15a575e5af6c1832bc1`
- Favourite Light notes: `ev_3bc9f41b3dfe5f7f22c15ce26e70bf1ed2d853c531d09a692982e402b1a87684`


### Bhai Dooj flow

Open `/create/?occasion=bhai-dooj`. Select a brother or sister and add both names, pick a loving, playful or far-away tone, then edit the three notes. You can restore each note’s starter, add an optional letter, and upload up to five photos. Gift settings are available from the photo step. Preview opens the recipient experience and offers free publishing or a return to editing.

Recipients advance through a welcome, a diya–tilak–sweets thali, the three notes and the instant-photo finale. Previous chapter and replay controls let them revisit the sequence. Previously published Bhai Dooj letters and photos remain readable.

REA traversed the [reference creator flow](https://koikoiapp.com/bhai-dooj) with synthetic names, selected a bond, continued through the editable notes, and skipped optional photos to reach the public preview and paid unlock prompt. Evidence `ev_6af3cae2369d12d27fc009aa8c36be6578b7ba262760d4fd5aa90cc8e15fd75c`. The supplied screenshots show the reference preview’s opening, thali and note scenes. The public unlock prompt was the verification boundary.
