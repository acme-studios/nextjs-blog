# Blog Starter (Next.js → Cloudflare Workers, SSG)

A fast, minimal static blog starter that renders Markdown posts with **Next.js 15 (App Router)**, exports a **fully static site (SSG)**, and serves it via **Cloudflare Workers + Static Assets**.  
Adapted from [Next.js Blog Starter](https://github.com/vercel/next.js/tree/canary/examples/blog-starter), and optimized for Cloudflare Workers with CI/CD-Ready [Workers Builds](https://developers.cloudflare.com/workers/platform/deployments/).

---

## Demo

https://blog.acme-studios.org

---

## One Click Deploy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/acme-studios/nextjs-blog)

## Tech stack

- **Next.js 15 (App Router)** – static export (`output: 'export'`)
- **React 19 RC**
- **Tailwind CSS**
- **Markdown** via `gray-matter` + `remark/remark-html`
- **Cloudflare Workers** (Worker + Static Assets binding)
- **Wrangler** for local dev & deploy

---

## Quick start

### Prerequisites
- Node.js **>= 18** (20 recommended)
- `npm` (or `pnpm/yarn` if you prefer)
- Cloudflare account + `npx wrangler login`

### 1) Clone the repository
```bash
git clone https://github.com/acme-studios/nextjs-blog.git
cd nextjs-blog
```

### 2) Install dependencies
```bash
npm install
```

### 3) Run locally (Next dev server)
```bash
npm run dev
# http://localhost:3000
```

### 4) Preview the static build on a local Worker
```bash
npm run preview
# http://localhost:8787
```

### 5) Deploy
```bash
npm run deploy
# https://<project-name>.<account-name>workers.dev
```

---

## Editing 
- Put Markdown files in _posts/, one file per post (e.g. milky-way.md).
- Put images in public/assets/blog/`<slug>`/ and author photos in public/assets/blog/authors/.
- On save/push, a new build will re-generate static HTML for the home page and each /posts/[slug].

---

## CI/CD with Workers Builds

This repo is connected to Workers Builds, so every change pushed to the `main` branch will trigger a new build and deploy to Cloudflare.
- The build step runs `npx opennextjs-cloudflare build` to ensure dependencies are installed cleanly and the site is compiled.
- The deploy step runs `npx opennextjs-cloudflare deploy` to deploy the static site to Cloudflare.
- Adding new blog posts will trigger a new build and deploy.
- For other branches, you can trigger preview deploys to test changes before merging. 

Always test locally with `npm run dev` and `npm run preview` before committing, so CI builds stay clean.

---

## Caching Strategy

This blog uses aggressive caching to maximize performance and minimize costs. Since content updates are infrequent (every 2-3 months), all assets are cached for extended periods.

### Cache Durations

| Asset Type | Browser Cache | Edge Cache | Immutable |
|------------|---------------|------------|-----------|
| HTML pages | 30 days | 180 days | No |
| Next.js static assets (`/_next/static/`) | 1 year | 1 year | Yes |
| Fonts (woff2, woff, ttf) | 1 year | 1 year | Yes |
| CSS and JS files | 30 days | 180 days | No |
| Images (png, jpg, webp, svg, etc.) | 30 days | 180 days | No |
| Other static assets | 30 days | 180 days | No |

### Cache Headers Explained

- **max-age**: Browser cache duration in seconds
- **s-maxage**: Cloudflare edge cache duration in seconds
- **immutable**: Indicates file will never change (safe for indefinite caching)

### Purging Cache After Updates

When you publish new blog posts, you need to purge the Cloudflare cache to ensure visitors see the latest content.

#### Option 1: Manual Purge (Cloudflare Dashboard)

1. Log in to Cloudflare Dashboard
2. Select your domain
3. Go to Caching > Configuration
4. Click "Purge Everything" or "Purge by URL"
5. Confirm the purge

#### Option 2: Automated Purge (CI/CD)

Add cache purging to your deployment workflow:

```bash
# Install dependencies
npm install

# Build and deploy
npm run deploy

# Purge cache (requires CF_ZONE_ID and CF_API_TOKEN environment variables)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}'
```

To set up automated purging:

1. Get your Zone ID from Cloudflare Dashboard (Overview page, right sidebar)
2. Create an API Token with "Cache Purge" permissions
3. Add `CF_ZONE_ID` and `CF_API_TOKEN` as secrets in your CI/CD environment
4. Add the purge command to your deployment script

#### Option 3: Selective Purge (Specific URLs)

Purge only specific pages instead of everything:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      "https://blog.acme-studios.org/",
      "https://blog.acme-studios.org/posts/new-post-slug"
    ]
  }'
```

### Cache Behavior

**First Visit:**
- Files are fetched from origin
- Cached at Cloudflare edge and in browser

**Return Visits (within 30 days):**
- Browser serves from local cache
- No network requests made

**After 30 days:**
- Browser checks Cloudflare edge
- Edge serves from cache (still fast)
- No origin requests

**After 180 days:**
- Edge cache expires
- Edge fetches from origin
- New cache cycle begins

### Performance Benefits

- Reduced origin requests (lower costs)
- Faster page loads (served from edge/browser)
- Global distribution via Cloudflare's network
- Minimal latency for all visitors

---

## License
MIT
