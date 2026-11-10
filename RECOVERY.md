# Source recovery — 10 November 2026

The local project directory and ZIP were accidentally deleted. The source was restored from the previously saved repository commit 95f1e23a7e101bbd2ba5c8b9d3d270fe35ec24b6. Newer local changes were reapplied from the implementation recorded in this conversation: rosewood/mauve/lavender styling, protected management panel, masked management link and direct editor action, deletion cancellation, schedule-draft persistence and accessible labels, Handmade Gifts Delhi attribution/metadata, and Vercel hosting explanations.

This is a reconstructed, verified source recovery, not a byte-for-byte recovery of the deleted ZIP or its original local Git commit. No remote source write or deployment was performed. The recreated ZIP excludes dependencies, generated builds, .git, private gift data and secrets. The package-lock.json remains available for npm ci.

Local gifts from the deleted data/ directory were not part of the source backup and are not restored. Browser drafts may still exist in the same browser's localStorage. Existing online R2 records were not read, modified or deleted by this recovery.

## Run after extracting

```bash
cd you-are-special
npm ci
npm run build
npm start
```

Open http://localhost:3000. If port 3000 is already in use, stop the older local server or use another PORT. On Linux/macOS, for example: PORT=3001 npm start. Hosting details and environment variables are in README.md and VERCEL-HOSTING.md. Nothing in these local commands deploys the app.

## Fresh verification

TypeScript and the Next.js production build passed. Four storage/API tests and three timezone/DST tests passed. All 18 desktop/mobile browser check groups passed against the recovered application on localhost:3001, including schedule restoration, management-link masking, upload/reordering/removal, full Birthday lifecycle, editing and deletion, all occasions and puzzle completion. No browser JavaScript errors were recorded. Fresh screenshots and results are in tests/results/.
