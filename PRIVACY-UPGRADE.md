# TohfaNote privacy upgrade

Implemented locally in the actual GitHub-connected source folder. No push or deployment is included in this update.

## Creator and recipient controls

- Optional six-digit recipient passcode. Salted scrypt hashes are stored server-side; raw passcodes are not stored in R2 or draft localStorage.
- Recipient unlock creates a signed, HttpOnly, SameSite=Lax cookie, Secure over HTTPS. It lasts at most 30 minutes and cannot authorize access after expiry, passcode changes, revocation or link regeneration. Content and photo endpoints both enforce access.
- Durable R2 attempt counters use atomic conditional writes. Five failures in a 15-minute window cause a full 15-minute cooldown beginning with the fifth failure. A gift-wide verification guard limits distributed attempts. Network identifiers are HMAC-derived with SESSION_SECRET; plain IPs are not stored in these application counters. This does not eliminate provider infrastructure request logging.
- Separate stable internal gift IDs and random recipient share IDs. Disable recipient link stops access; regenerate creates a replacement and invalidates old URLs/sessions. Already delivered/downloaded content cannot be recalled.
- Management-key rotation activates a new 256-bit key and rejects the old one. The replacement is generated in the creator's browser before the request and remains available as a recovery link if a network error occurs. Save the active replacement privately; lost keys are not recoverable.
- Published share page includes Create yours, Manage this gift and TohfaNote · Created by Handmade Gifts Delhi. Recipient pages include Create yours and Manage a gift without exposing a secret creator link.

## 30-day retention

New gifts expire at most 30 days after publication. Creators may choose an earlier expiry. Edits and link/key changes do not extend the maximum. Opening must happen before expiry.

Before expiry, creator management works even while the recipient link is disabled or scheduled. At expiry, recipients receive no letter/photos. Expired management shows only minimal information and a deletion option, rather than exposing expired content.

Deletion replaces the live gift with a minimal tombstone first, removing its content and revoking access atomically, then removes the record/link. A failed final deletion can leave non-content metadata for cleanup; it does not leave the letter/photos in that live record.

A daily Vercel cron at 03:00 UTC calls /api/maintenance/cleanup/ with CRON_SECRET. API access expiry is exact; physical cleanup follows a successful job and can be delayed by outages or bounded processing. Monitor failures/pending results and retry. Backups, provider retention and recipient copies are not erased by the application.

## Existing gifts: migration

The first privacy initialization writes one immutable activation timestamp under settings/privacy-v1 in the private bucket. Legacy gifts keep their original URLs and management-key hashes and receive 30 days from that timestamp. Their deadline does not keep extending on later visits.

For a complete rollout, run `npm run privacy:migrate` once using your private local .env.local with the real R2 variables. It reads/indexes all existing gifts without printing contents or keys. This establishes deadlines for dormant gifts too. It was not run against your real account in this session. The daily job also migrates legacy records in resumable batches of 25 as a fallback; large existing collections should use the one-time command before announcing the retention policy.

## Required Vercel environment changes

Keep your four R2 variables. Add two DIFFERENT cryptographically random secrets, each at least 32 characters:

- SESSION_SECRET: signs unlock sessions and HMACs attempt identifiers. Keep it stable across deployments. Changing it invalidates sessions and changes attempt identifiers.
- CRON_SECRET: authorizes the cleanup endpoint. Vercel's cron sends it as a bearer token. Never expose it through a public URL or NEXT_PUBLIC_ variable.

Generate each privately on your machine, for example by running this command twice and saving each different result:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Put the variables in Production, and Preview if needed, then redeploy after your code push. Vercel mode refuses a missing/short SESSION_SECRET for protected operations; cleanup refuses a missing/short CRON_SECRET. No secret values are included in this repository.

For local filesystem testing, a random local session secret is stored under private data/settings/local-secret.json and persists across server restarts. Never expose or commit data/.

## Draft and URL privacy

New homepage-to-builder navigation uses temporary sessionStorage rather than recipient-name URL parameters. Old name parameters are read for compatibility and removed from the visible URL; this cannot erase prior browser history or server logs. Clear draft confirms removal and clears the saved draft, photos, passcode form state and current form. It does not delete a published gift.

Drafts remain on the user's browser unless cleared or published. New passcodes are deliberately excluded from saved drafts and must be re-entered after refresh.

## Browser protections

Per-response random nonces authorize Next.js scripts; no script unsafe-inline/unsafe-eval is enabled in production. All pages are dynamically rendered so each response gets its own nonce. This has additional function/caching cost compared with static pages.

CSP restricts resources to the application with narrow data/blob allowances for photo previews and existing media behavior. Inline styles remain allowed for React's gallery/puzzle/animation styling; this is a deliberate style allowance, not a script allowance. Frame embedding is blocked by CSP frame-ancestors none and X-Frame-Options DENY. Also set nosniff, no-referrer, restricted Permissions-Policy, private-page no-store and HSTS on HTTPS responses. Development alone permits unsafe-eval for tooling.

## Footer and policies

REA public-homepage inspection observed a footer organized into brand/about/contact, Gifts, Help and Policies, plus payment support. Evidence: ev_2c3557c05898387c6cfe3a5cf3a7c7f204182d6e0cc783faa963d9e94733344a. The reference was not copied. TohfaNote's original footer uses those practical groups and replaces payment support with free digital-gift help.

Support: +91 75030 05113, tel:+917503005113 and https://wa.me/917503005113. No messages are sent automatically. New pages: Privacy, Terms, Cookies & Browser Storage, Retention & Data Deletion, About and Contact. They describe the actual access model, providers, retention and deletion limits; they make no end-to-end-encryption or guaranteed-recovery claim.

## Verification

Fresh TypeScript/production builds and backend tests cover salted hashes, protected photo access, cookie scope, durable/concurrent attempt limits, full cooldown timing, link/key rotation, expiry limits, cleanup index repair, passcode removal, legacy migration and S3 record listing.

The full 18-group browser suite and 10 dedicated privacy browser groups passed locally against isolated temporary gift storage. The privacy suite covers recipient-name-free navigation, draft clearing, no plaintext passcodes in drafts, share CTAs/credit, passcode entry, HttpOnly cookies, revocation/regeneration, management-key rotation/reload, deletion/cancellation, footer/help links, all six policy pages, mobile overflow, cron authorization and CSP/header checks. See tests/results/privacy-browser-results.json. No real user gift records, real R2 credentials or production environment were used in these tests.

## Important limits

This is access control with private provider storage, not end-to-end encryption. Authorized backend/storage administrators can access stored content. Protect your Vercel/Cloudflare/GitHub accounts with MFA and least-privilege access. Keep the R2 bucket private (public r2.dev and bucket custom-domain exposure disabled). Maintain a suitable backup/retention policy and monitor the cleanup job. For higher traffic, add platform/global creation-abuse controls; per-gift protections do not promise unlimited denial-of-service resistance.

Use a separate private bucket and distinct SESSION_SECRET for Preview environments where possible, so preview code does not receive access to production customer gifts. Never test bulk migration/cleanup against a bucket you do not intend to modify. These operational settings require your account configuration; they were not changed automatically.

## Mobile and email update

Passcodes use six masked visual slots backed by a single keyboard/paste-accessible input; these remain creator-chosen passcodes, not emailed OTPs. Email support opens mailto:umesh.devcraft@gmail.com. Share by email opens the visitor’s email app with a gift link. No SMTP credentials or email delivery service is needed. Clear draft resets all fields, photos, code, schedule, theme/music and saved browser draft without a blocking dialog; pending photo work cannot refill it. The mobile suite checks 320, 360, 390 and 430 px widths.
