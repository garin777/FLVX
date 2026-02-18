# FLVX.AI

The world's first AI-native electronic music label.

## Deploy to GitHub Pages

### 1. Create repo
- Go to github.com → New Repository
- Name it `flvx-site` (or anything)
- Public repo
- Push these files

### 2. Enable GitHub Pages
- Go to repo → Settings → Pages
- Source: **Deploy from a branch**
- Branch: `main` / `/ (root)`
- Save

### 3. Connect flvx.ai domain

**In your domain registrar (wherever you bought flvx.ai):**

Add these DNS records:

| Type  | Name | Value                    |
|-------|------|--------------------------|
| A     | @    | 185.199.108.153          |
| A     | @    | 185.199.109.153          |
| A     | @    | 185.199.110.153          |
| A     | @    | 185.199.111.153          |
| CNAME | www  | YOUR_GITHUB_USERNAME.github.io |

**In GitHub repo → Settings → Pages:**
- Custom domain: `flvx.ai`
- Check "Enforce HTTPS" (may take a few minutes to appear)

### 4. Done
Site will be live at https://flvx.ai within a few minutes.

## Quick push commands

```bash
git init
git add .
git commit -m "launch flvx.ai"
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/flvx-site.git
git push -u origin main
```
