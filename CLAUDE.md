# FLVX Project

## What this is
Landing page for **FLVX.AI** — the world's first AI-native electronic music label. Single-page static site (pure HTML/CSS/JS, no framework, no build step).

## Live URLs
- https://flvx-ai.web.app
- https://flvx-ai.firebaseapp.com
- https://flvx.ai (custom domain, DNS propagating via Spaceship registrar)

## Hosting
**Firebase Hosting** — project ID `flvx-ai`

Deploy commands (run from `~/FLVX` on Dmitrii's Mac):
```bash
firebase deploy --only hosting   # site only
firebase deploy --only functions  # Cloud Function only
firebase deploy                   # both
```
After pulling changes always run `git pull` first.

## Waitlist / Email
Form submissions are handled by a **Firebase Cloud Function** (`functions/index.js`) which calls the **Resend API** to add contacts to the FLVX waitlist audience.

- Resend audience/segment ID: `07ea7778-9d16-4c98-af51-2c2543b88c9b`
- Resend API key in use: full-access key (set in `functions/index.js`)
- Function URL: `https://us-central1-flvx-ai.cloudfunctions.net/subscribe`
- After updating the function: `cd functions && npm install && cd .. && firebase deploy --only functions`

## Git
- Repo: `garin777/FLVX` on GitHub
- Working branch: `claude/deploy-firebase-e7gr6`
- Always develop and push to this branch

## Team (as shown on the site)
**Founded by:**
- Dmitrii Garin — Hyperboloid Music, electronic music / enterprise tech / AI. London.
- Dr. Roman Belavkin — AI scientist, Solar X, Art-TeK Records. London.
- Olga Ponomarenko — brand, growth & storytelling. Independent Media, Robb Report, Esquire, Popular Mechanics, Hyperboloid Music. London Business School AI Marketing. London.

**Advisory Board:**
- Ritch Sibthorpe — Disney Music EMEA, Meta music publishing, Warner Music Group, Muwzo AI. London.
- Chris Cook — CMO All3, Golazo founder. UK.

## Key files
- `index.html` — entire site (HTML + embedded CSS + JS)
- `functions/index.js` — Firebase Cloud Function (Resend integration)
- `functions/package.json` — function dependencies (firebase-functions, resend)
- `firebase.json` — hosting + functions config
- `.firebaserc` — project alias (`flvx-ai`)
