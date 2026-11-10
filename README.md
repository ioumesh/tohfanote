# TohfaNote

Created by [Handmade Gifts Delhi](https://www.instagram.com/handmadegiftsdelhi/).

Recovered local version: see RECOVERY.md. The latest attribution, design, and management refinements have not been redeployed. Read VERCEL-HOSTING.md before importing into Vercel; the current backend targets local Node hosting and Cloudflare Workers.

Intended production domain: https://tohfanote.live (not configured or deployed by this update).

Tagline: Har tohfe mein dil ki baat.

Preferred social handle: @tohfanote

A mobile-first, free digital gifting website built with Next.js, React, TypeScript and Tailwind CSS. Original cream, blush and lavender design, SVG/CSS artwork and browser-generated music. No paid APIs, third-party image hosts, analytics, payments or runtime CDN dependencies.

## Run locally

Use Node.js 22.13+ (verified on 24.11.1) and npm.

```bash
npm ci
npm run build
npm start
```

Open http://localhost:3000. `npm run dev` builds and starts the same complete server; it does not provide hot reload. Rebuild after source edits, then restart the server. `next dev` alone does not include the gift API.

### Environment

No API credentials are needed for local operation. Optional Node server variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP listening port; listens on all interfaces |
| `DATA_DIR` | `./data` | Private persistent directory for gifts and photos; mount a durable disk in production |
| `PUBLIC_ORIGIN` | request origin | Your canonical HTTPS origin behind a reverse proxy, e.g. `https://gifts.example.com` |
| `TEST_ORIGIN` | `http://localhost:3000` | Browser test target |
| `CHROME_PATH` | `/usr/bin/google-chrome` | Installed Chrome/Chromium executable for browser tests |

Variables must be exported in the shell/service environment; the custom Node server does not automatically load `.env` files. `.env.example` documents them. Never serve `DATA_DIR` as static files. Keep private backups if needed.

For another phone on your LAN, use the computer's LAN address (not localhost), allow the selected port in your firewall, and keep the server running. Internet sharing requires the deployed HTTPS site or an HTTPS Node host with persistent disk. Plain LAN HTTP can restrict clipboard APIs; the app leaves selectable links as a fallback.

## Hosted architecture

Next.js statically exports the React routes to `out/`. `scripts/package.mjs` packages those assets with the shared API into a Cloudflare Worker ES module at `dist/server/index.js`. The original Next.js project remains editable and is not rewritten into another framework.

`.openai/hosting.json` binds a durable R2 bucket as `BUCKET`. Sites provisions the binding when deployed. No database, R2 access keys, or other secrets need to be shipped to the browser. Gift JSON and resized images are persisted together in one R2 object per gift; atomic deletion removes both. The local Node adapter uses private JSON files and atomic file replacement with per-process write serialization. Local files and hosted R2 are separate stores.

Only the homepage, `/create/`, `/gift/?id=…`, and `/manage/#id=…&key=…` are frontend routes. The random gift identifier has 192 bits of entropy. Management keys have 256 bits of entropy and are stored only as SHA-256 hashes server-side. The management key stays in the URL fragment and is sent to the API through an Authorization header. It is not placed in browser draft storage, recipient links, analytics, or server URL query strings.

The creator must keep the management link or download its private backup. There is no email/account recovery. Losing that link loses editing/deletion access. Anyone with a recipient link can view, save and forward the gift; this is unlisted link access, not end-to-end encryption. Search indexing is discouraged with page metadata, robots.txt and X-Robots-Tag. No gift list endpoint exists. Scheduled gift contents and photo endpoints remain sealed server-side until the selected UTC instant. Timezones use IANA names; nonexistent and ambiguous daylight-saving times are rejected by the builder. Recipient clocks do not decide access.

## Working flows

- Homepage name → seven occasion choices → names/letter → upload/reorder/remove photos → theme/music/schedule → full preview → free publish → Copy Link or WhatsApp URL.
- Birthday envelope, personal greeting, candles and confetti, swipe/keyboard photo gallery, readable letter, replay, user-initiated chimes and volume control.
- Love, Best Friend and Apology reuse the complete envelope/gallery/letter experience with occasion-specific greeting.
- Anniversary adds up to five editable timeline milestones; a small default story is shown if omitted.
- Proposal adds an explicit reveal and local response choices, including time to think; responses are not transmitted to the sender.
- Photo Puzzle requires a photo and provides a keyboard/touch operable 3×3 swap puzzle with completion state.
- Secret management link → protected editor → save without changing the recipient URL, or confirm permanent deletion.
- Server-side validation, request/image limits, same-origin mutation checks, optimistic revision checks, basic per-runtime publishing throttling, loading/empty/not-found/storage-error states. Images are resized to at most 1000px, JPEG-encoded on device, and original metadata is discarded by canvas encoding.

Drafts alone use localStorage. Browser quota errors are reported; keep the tab open until publishing if saving a large draft fails. Maximum six photos, 12 MB per original, and 750 KB per processed image. The gift request body is capped at 8 MiB. Music consists of original synthesized chimes and starts only after the recipient presses Play music. Reduced-motion CSS suppresses animations and confetti.

## Verification

```bash
npm run check
npm test
# Start `npm start` in another terminal first:
node tests/browser.mjs
```

Browser tests use the `playwright-core` development dependency and an existing Chrome installation (no automatic browser downloads). Tests publish synthetic gifts and delete them, verify new browser contexts with no shared storage, check editing/deletion, scheduled opening, photos, music, all occasions, mobile overflow and browser JavaScript errors. Screenshots/results are under `tests/results/`. API tests independently reopen filesystem storage, verify management denial, image serving, revision conflicts, server scheduling, validation, deletion and storage failures.

Read `REFERENCE-ANALYSIS.md` for six REA observations and `VERIFICATION.md` for the actual verification results and limits.

## Operational limits

No account recovery, moderation dashboard, automatic expiration, email delivery, analytics or payments. WhatsApp is a normal prefilled share link: the user must choose a recipient and send; no message is sent automatically. Music playback depends on browser Web Audio support. The server's small in-memory request throttle is per process/isolate; a high-traffic public service should add edge rate controls and storage budgeting. The Node adapter is intended for one server process; use the R2 adapter for multi-instance hosting. Keep original photos elsewhere. There is no guaranteed retention SLA.
# tohfanote
