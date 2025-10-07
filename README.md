# Blog Starter (Next.js → Cloudflare Workers, SSG)

A fast, minimal static blog starter that renders Markdown posts with **Next.js 15 (App Router)**, exports a **fully static site (SSG)**, and serves it via **Cloudflare Workers + Static Assets**.  
Adapted from [Next.js Blog Starter](https://github.com/vercel/next.js/tree/canary/examples/blog-starter), and optimized for Cloudflare Workers with CI/CD-Ready [Workers Builds](https://developers.cloudflare.com/workers/platform/deployments/).

---

## Demo

https://blog.acme-studios.org

---

## One Click Deploy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/vnikhilbuddhavarapu/nextjs-blog-starter)

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
git clone https://github.com/vnikhilbuddhavarapu/nextjs-blog-starter.git
cd nextjs-blog-starter
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

Always test locally with `npm run dev` or `npm run preview` before committing, so CI builds stay clean.


## License
MIT
