export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    const url = new URL(request.url);   
    const res = await env.ASSETS.fetch(request);

    // Clone response to modify headers
    const r = new Response(res.body, res);

    const ct = r.headers.get("content-type") || "";
    const isHtml = ct.includes("text/html");

    // Aggressive caching strategy for static blog content
    // Content updates are infrequent (every 2-3 months)
    // Cache can be manually purged via Cloudflare dashboard after new posts
    
    if (isHtml) {
      // HTML pages: 1 month browser cache, 6 months edge cache
      // Browser: 2592000 seconds (30 days)
      // Edge: 15552000 seconds (180 days)
      r.headers.set("Cache-Control", "public, max-age=2592000, s-maxage=15552000");
    } else if (url.pathname.startsWith("/_next/static/")) {
      // Next.js hashed static assets: 1 year cache, immutable
      // These files have content hashes in filenames, safe to cache indefinitely
      r.headers.set("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
    } else if (
      url.pathname.endsWith(".woff2") ||
      url.pathname.endsWith(".woff") ||
      url.pathname.endsWith(".ttf")
    ) {
      // Fonts: 1 year cache, immutable
      r.headers.set("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
    } else if (
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".js")
    ) {
      // CSS and JS files: 1 month browser cache, 6 months edge cache
      r.headers.set("Cache-Control", "public, max-age=2592000, s-maxage=15552000");
    } else if (
      url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|avif)$/)
    ) {
      // Images: 1 month browser cache, 6 months edge cache
      r.headers.set("Cache-Control", "public, max-age=2592000, s-maxage=15552000");
    } else {
      // Default for other static assets: 1 month browser cache, 6 months edge cache
      r.headers.set("Cache-Control", "public, max-age=2592000, s-maxage=15552000");
    }

    // Security headers
    r.headers.set("X-Content-Type-Options", "nosniff");
    r.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    r.headers.set("X-Frame-Options", "DENY");
    r.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self' data:",
        "connect-src 'self' https://cloudflareinsights.com https://static.cloudflareinsights.com",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'"
      ].join("; ")
    );

    return r;
  },
};
