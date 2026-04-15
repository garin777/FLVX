# FLVX Project

## What this is
Landing page for **FLVX.AI** — the world's first AI-native electronic music label. Single-page static site (pure HTML/CSS/JS, no framework, no build step).

## Live URLs
- https://flvx-ai.web.app
- https://flvx-ai.firebaseapp.com
- https://flvx.ai (custom domain, DNS via Spaceship registrar)

## Hosting
**Firebase Hosting** — project ID `flvx-ai`

Deploy commands (run from `~/FLVX` on Dmitrii's Mac):
```bash
firebase deploy --only hosting    # site only
firebase deploy --only functions  # Cloud Functions only
firebase deploy                   # both
```
Always `git pull` before deploying.

## Git
- Repo: `garin777/FLVX` on GitHub
- Working branch: `claude/deploy-firebase-e7gr6`
- Always develop and push to this branch

## Key files
- `index.html` — entire site (HTML + embedded CSS + JS)
- `functions/index.js` — Firebase Cloud Functions (subscribe + confirm)
- `functions/package.json` — dependencies: firebase-functions, firebase-admin, resend
- `firebase.json` — hosting + functions config, `/confirm` route rewrite
- `.firebaserc` — project alias (`flvx-ai`)

---

## Waitlist / Email flow

### Architecture
```
User submits email
  → subscribe() Cloud Function
    → stores pending signup in Firestore (signups/{email})
    → sends opt-in email via Resend
  → User clicks confirm link (flvx.ai/confirm?token=xxx)
  → confirm() Cloud Function
    → validates token
    → assigns waitlist position (Firestore counter in meta/counter)
    → generates referral code
    → adds contact to Resend audience
    → credits referrer if ref code present
    → sends welcome email
  → redirects to flvx.ai?confirmed=true&position=N&ref=CODE
  → index.html shows position + "check your email"
```

### Cloud Functions
- `subscribe` — POST, accepts `{ email, ref }`, stores pending signup, sends opt-in email
- `confirm` — GET, accepts `?token=xxx`, confirms signup, assigns position, sends welcome email
- Function URL: `https://us-central1-flvx-ai.cloudfunctions.net/subscribe`
- Confirm route: `https://flvx.ai/confirm?token=xxx` (rewrites to confirm function via firebase.json)

### Resend
- API key: full-access key in `functions/index.js`
- Audience ID: `07ea7778-9d16-4c98-af51-2c2543b88c9b`
- From address: `FLVX <waitlist@flvx.ai>` — **requires flvx.ai verified as sending domain in Resend**
  - Go to resend.com/domains → Add Domain → flvx.ai → add DNS records in Spaceship

### Firestore collections
- `signups/{email}` — fields: email, token, referredBy, confirmed, createdAt, confirmedAt, position, referralCode, referralCount
- `meta/counter` — fields: count (waitlist position counter)

### Tally onboarding form
- **TODO: create form at tally.so and replace `TALLY_PLACEHOLDER` in `functions/index.js`**
- Suggested questions: artist or fan/manager, genre, country, Spotify/SoundCloud link
- Instagram CTA in welcome email: @flvx_ai

### Referral system
- Each confirmed user gets a unique referral code (8-char hex, e.g. `A3F9C12B`)
- Referral link: `flvx.ai?ref=CODE`
- When someone signs up via referral link, ref code is passed in POST body
- On confirmation, referrer's `referralCount` is incremented in Firestore
- Tracked internally only — no public leaderboard

---

## Team (as shown on the site)
**Founded by:**
- Dmitrii Garin — Hyperboloid Music, electronic music / enterprise tech / AI. London.
- Dr. Roman Belavkin — AI scientist, Solar X, Art-TeK Records. London.
- Olga Ponomarenko — brand, growth & storytelling. Independent Media, Robb Report, Esquire, Popular Mechanics, Hyperboloid Music. London Business School AI Marketing. London.

**Advisory Board:**
- Ritch Sibthorpe — Disney Music EMEA, Meta music publishing, Warner Music Group, Muwzo AI. London.
- Chris Cook — CMO All3, Golazo founder. UK.

---

## Pending / TODOs
1. ~~Verify `flvx.ai` as sending domain in Resend~~ ✓
2. ~~Create Tally onboarding form~~ ✓ — https://tally.so/r/WOMypa
3. Deploy latest changes: `cd functions && npm install && cd .. && firebase deploy`
