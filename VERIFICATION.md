# Verification record

Verified 10 November 2026. Public hosting verification is recorded separately below when deployment completes.

## Local implementation

- Next.js 16.4.6 production compilation, TypeScript and static export passed. The initial sandbox denied build-worker process/port operations; the production build succeeded with the normal execution permission. The Webpack build path is pinned in the package script for this environment.
- The Next.js/React versions were updated after npm identified the initially selected older Next.js version as vulnerable. Exact resolved versions are locked in package-lock.json.
- API lifecycle tests passed: creation, input validation, real image bytes, filesystem reopening through a fresh storage adapter, management authorization denial, updating, optimistic revision conflicts, deletion of photos and gift, scheduled server sealing/unlocking, unlisted routes and safe storage errors.
- Full Chromium browser verification passed 17 grouped checks. See `tests/results/browser-results.json`. Synthetic gifts from completed runs were deleted after checks.
- Birthday was verified from homepage recipient input through draft restoration, upload/reorder/removal, unsupported-file handling, theme/music choice, interactive preview, publishing, Copy Link, WhatsApp URL, recipient opening, protected editing and permanent deletion.
- A separate isolated mobile browser context opened the shared HTTP URL without creator localStorage, read the real saved letter and loaded the persisted image. This proves independence from the creator's browser state. It is browser emulation on the same machine, not a physical second phone.
- Scheduled content was unavailable before the server opening time and opened automatically afterward. Creator management remained available while sealed. API tests also checked that photo endpoints stay sealed.
- All seven occasions were published and opened through the shared contract. Anniversary milestones rendered; Proposal revealed and accepted a request for more time; the 3×3 Photo Puzzle was solved by swapping pieces and reached its success state. Love, Best Friend and Apology render the full gallery/letter flow.
- Desktop (1440px) and mobile (390px viewport with touch emulation) screenshots were captured. Homepage, builder and recipient pages had no detected horizontal CSS overflow. The pages were visually inspected from the screenshots.
- No browser JavaScript page errors occurred in the completed suite. Native form validation and server validation were exercised. Keyboard photo navigation, candle controls, explicit music start/pause, reduced-motion mode and selectable clipboard fallback are implemented. Browser checks verified keyboard gallery, user-initiated audio and the native Clipboard API on localhost.

## External boundaries

- WhatsApp sharing was verified as a correctly encoded `wa.me` URL. No WhatsApp message was sent and no recipient account was accessed.
- No physical iOS/Android device or Safari was available. Chrome touch emulation and independent contexts were used.
- No live payment, email or account service is required or claimed. No messages are sent automatically.
- Scheduled time conversion handles IANA timezones and daylight-saving ambiguity in code; automated calendar edge cases are checked separately in the unit tests when listed.
- Rate limiting is a small per-runtime defense, not a global abuse-protection service.

## Hosted verification

The public HTTPS deployment at https://you-are-special-gifts-umesh.openbetta24.chatgpt.site passed the same 17 grouped browser checks, including full creation/upload/preview/publishing, independent mobile browser reopening, real R2 image loading, management denial without a key, edits visible through the same recipient URL, deletion, server-held scheduled opening, all seven occasions and puzzle completion. No browser JavaScript errors occurred. The deployed runtime uses the provisioned BUCKET R2 binding and requires no user-supplied external credentials. The source runtime corresponds to the final refined production build.

The first hosted test attempt asserted image readiness before its remote network load completed. The harness was corrected to wait for decoded image content, then the complete suite passed. Its initial failure left one synthetic gift using demo names and generated test artwork; no real user information was involved. Later test runs perform cleanup in finally blocks as well as explicit deletion checks. Completed hosted checks are recorded in `tests/results/browser-results.json`.

Seven individual API/timezone tests also passed: four storage/authorization/validation lifecycle tests and three IANA/DST tests. Timezone tests freeze the reference clock for repeatability. The mobile homepage's decorative orbit overflow was corrected; final screenshot width is exactly 390 pixels, and viewport checks compare to the configured 390px width rather than a potentially auto-expanded mobile innerWidth.

No physical second device or Safari was used. The recipient test used an independent mobile browser context with no shared localStorage against the public HTTPS URL. The WhatsApp link and Clipboard API were verified; no WhatsApp message was sent. A deployed URL was opened in the Codex browser panel (the app reported the handoff as queued).
