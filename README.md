# Fullstack Portfolio Website

A modern, animated, dark/light-mode portfolio site with a serverless backend —
built with plain HTML/CSS/JavaScript on the frontend and Vercel Serverless
Functions on the backend. Zero framework build step, zero required npm
dependencies, and ready to deploy to **Vercel** with a **GitHub Actions
CI/CD pipeline**.

## ✨ Features

- **Modern design** — glassmorphism cards, gradient accents, animated blobs,
  scroll-reveal animations, typing effect, animated counters, dark/light theme
  toggle (persisted), fully responsive with a mobile nav.
- **Fullstack** — a static frontend plus two serverless API routes:
  - `GET /api/projects` — serves your project list from `data/projects.json`
    (frontend fetches this dynamically).
  - `POST /api/contact` — validates contact form submissions, blocks spam with
    a honeypot field and a lightweight per-IP rate limiter, and optionally
    emails you via [Resend](https://resend.com) if `RESEND_API_KEY` is set.
- **No required dependencies** — runs on the Vercel Node.js runtime with zero
  npm installs. A tiny built-in `dev-server.js` lets you test everything
  locally without needing the Vercel CLI.
- **CI/CD included** — `.github/workflows/ci-cd.yml` lints + tests every push
  and PR, deploys PR previews, and deploys to production on merge to `main`.

## 📁 Project Structure

```
portfolio-website/
├── api/
│   ├── contact.js        # POST /api/contact — form handling + validation
│   └── projects.js       # GET  /api/projects — serves project data
├── data/
│   └── projects.json     # Edit this to add/update your projects
├── css/
│   └── style.css
├── js/
│   └── main.js
├── assets/images/        # Project thumbnails (SVG placeholders included)
├── tests/
│   └── api.test.js       # Zero-dependency test suite for the API routes
├── .github/workflows/
│   └── ci-cd.yml         # GitHub Actions CI/CD pipeline
├── dev-server.js         # Local dev server (no Vercel CLI required)
├── vercel.json           # Routing + security headers config
├── .env.example          # Environment variable template
└── index.html
```

## 🚀 Quick Start (Local Development)

**Option A — built-in dev server (no install needed):**
```bash
node dev-server.js
# open http://localhost:3000
```

**Option B — Vercel CLI (matches production most closely):**
```bash
npm install --global vercel
vercel dev
```

Run the test suite anytime with:
```bash
npm test
```

## 🎨 Customize It

1. **Your info** — edit the text directly in `index.html` (name, bio, email,
   social links in the `.socials` section, résumé link).
2. **Projects** — edit `data/projects.json`. Each entry supports `title`,
   `description`, `tags`, `image`, `liveUrl`, `repoUrl`, and `featured`.
3. **Colors/branding** — tweak the CSS variables at the top of `css/style.css`
   (`--grad-start`, `--grad-mid`, `--grad-end`, etc.).
4. **Contact form email delivery** — sign up at resend.com, then set
   `RESEND_API_KEY` and `CONTACT_TO_EMAIL` (see `.env.example`). Without these,
   the form still works and validated submissions are simply logged.

## ☁️ Deploying to Vercel

### First-time setup
1. Push this project to a new GitHub repository (see Git section below).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your
   GitHub repo. Vercel auto-detects the static frontend + `/api` functions —
   no build configuration needed.
3. Add environment variables (if using email delivery) under
   **Project Settings → Environment Variables**: `RESEND_API_KEY`,
   `CONTACT_TO_EMAIL`.
4. Click **Deploy**. That's it — Vercel now redeploys automatically on every
   push to `main` (this is Vercel's native Git integration).

### Using the included GitHub Actions pipeline instead
The repo also ships with `.github/workflows/ci-cd.yml`, which gives you an
explicit CI/CD pipeline: it lints and tests every push/PR, deploys a preview
for each pull request, and deploys to production on merge to `main`. To use it:

1. In your Vercel account, create a **Personal Access Token**
   (Account Settings → Tokens).
2. Run `vercel link` locally once to link the folder to a Vercel project,
   which creates a `.vercel/project.json` with your `orgId` and `projectId`.
3. In your GitHub repo, go to **Settings → Secrets and variables → Actions**
   and add:
   - `VERCEL_TOKEN` — the token from step 1
   - `VERCEL_ORG_ID` — from `.vercel/project.json`
   - `VERCEL_PROJECT_ID` — from `.vercel/project.json`
4. Push to `main` — GitHub Actions will lint, test, and deploy automatically.

> You can use **either** Vercel's native Git integration **or** the GitHub
> Actions workflow — using both at once will simply deploy twice per push,
> which is harmless but redundant. Most teams pick one.

## 🔧 Git Setup

This project is already initialized as a Git repository locally. To push it
to GitHub:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

## 🛡️ Security Notes

- `vercel.json` sets baseline security headers (CSP, X-Frame-Options,
  Referrer-Policy, etc.) — adjust the CSP if you add external scripts/fonts.
- The contact endpoint includes basic input validation, a honeypot field, and
  a simple in-memory rate limiter (per warm serverless instance). For
  stricter, cross-instance rate limiting at scale, consider Vercel KV or
  Upstash Redis.

## 📄 License

MIT — use this freely as the basis for your own portfolio.
