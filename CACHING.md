# Caching Strategy Documentation

## Overview

This Next.js blog uses an aggressive caching strategy optimized for static content that changes infrequently (every 2-3 months). The caching implementation is handled in `src/index.ts` via Cloudflare Workers.

## Architecture

### Caching Layers

1. **Browser Cache** (controlled by `max-age`)
   - Local cache on visitor's device
   - Fastest possible delivery
   - No network requests when valid

2. **Cloudflare Edge Cache** (controlled by `s-maxage`)
   - Distributed globally across Cloudflare's network
   - Serves cached content from nearest data center
   - Reduces origin requests

3. **Origin** (Cloudflare Workers + Static Assets)
   - Only contacted when edge cache expires or is purged
   - Serves pre-built static files from `.open-next/assets`

## Cache Configuration

### HTML Pages

```
Cache-Control: public, max-age=2592000, s-maxage=15552000
```

- **Browser:** 30 days (2,592,000 seconds)
- **Edge:** 180 days (15,552,000 seconds)
- **Rationale:** HTML contains the structure and content. Long cache is safe because content updates are rare and cache can be purged manually.

### Next.js Static Assets (`/_next/static/`)

```
Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable
```

- **Browser:** 1 year (31,536,000 seconds)
- **Edge:** 1 year (31,536,000 seconds)
- **Immutable:** Yes
- **Rationale:** These files have content hashes in their filenames (e.g., `chunk-abc123.js`). If content changes, filename changes, so old cached versions are never served incorrectly.

### Fonts (woff2, woff, ttf)

```
Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable
```

- **Browser:** 1 year
- **Edge:** 1 year
- **Immutable:** Yes
- **Rationale:** Font files rarely change and are large. Aggressive caching improves performance significantly.

### CSS and JavaScript Files

```
Cache-Control: public, max-age=2592000, s-maxage=15552000
```

- **Browser:** 30 days
- **Edge:** 180 days
- **Rationale:** Non-hashed CSS/JS files that may be updated with new blog posts.

### Images (png, jpg, webp, svg, ico, avif)

```
Cache-Control: public, max-age=2592000, s-maxage=15552000
```

- **Browser:** 30 days
- **Edge:** 180 days
- **Rationale:** Blog images in `/assets/blog/` directory. Cached aggressively but can be purged when new posts are added.

### Default (Other Static Assets)

```
Cache-Control: public, max-age=2592000, s-maxage=15552000
```

- **Browser:** 30 days
- **Edge:** 180 days
- **Rationale:** Catch-all for any other static files served by the worker.

## Cache Purging

### When to Purge

Purge the cache whenever you:
- Publish a new blog post
- Update existing blog content
- Change site design or layout
- Update images or assets

### Manual Purge via Dashboard

1. Log in to Cloudflare Dashboard
2. Navigate to your domain
3. Go to Caching > Configuration
4. Click "Purge Everything"
5. Confirm the action

**Note:** Cache purge is instant but may take a few seconds to propagate globally.

### Automated Purge via API

#### Purge Everything

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}'
```

#### Purge Specific URLs

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      "https://yourdomain.com/",
      "https://yourdomain.com/posts/new-post"
    ]
  }'
```

#### Purge by Cache Tag

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"tags":["blog-posts"]}'
```

**Note:** Cache tags require Enterprise plan or custom implementation.

### Setting Up API Credentials

1. **Get Zone ID:**
   - Cloudflare Dashboard > Select domain > Overview
   - Zone ID is in the right sidebar under "API"

2. **Create API Token:**
   - Cloudflare Dashboard > My Profile > API Tokens
   - Click "Create Token"
   - Use "Edit zone DNS" template or create custom token
   - Permissions needed: Zone > Cache Purge > Purge
   - Set zone resources to specific zone or all zones
   - Create token and save it securely

3. **Store Credentials:**
   - Never commit tokens to git
   - Use environment variables in CI/CD
   - Store in secrets manager (GitHub Secrets, etc.)

## Performance Impact

### Before Caching (Hypothetical)

- Every page load hits origin
- Latency: 200-500ms (depending on visitor location)
- Origin requests: 100% of traffic
- Bandwidth costs: High

### After Aggressive Caching

- First visit hits origin, subsequent visits from cache
- Latency: 10-50ms (edge cache) or 0ms (browser cache)
- Origin requests: <1% of traffic (only cache misses)
- Bandwidth costs: Minimal

### Estimated Metrics

For a blog with 10,000 monthly visitors:
- **Without caching:** 10,000 origin requests
- **With caching:** ~100 origin requests (99% cache hit rate)
- **Cost savings:** ~99% reduction in origin bandwidth
- **Performance gain:** 5-10x faster page loads

## Cache Validation

### Testing Cache Headers

Use curl to verify cache headers:

```bash
curl -I https://yourdomain.com/
```

Look for:
```
cache-control: public, max-age=2592000, s-maxage=15552000
cf-cache-status: HIT
```

### Cache Status Values

- **HIT:** Served from Cloudflare edge cache
- **MISS:** Not in cache, fetched from origin
- **EXPIRED:** Cache expired, revalidating
- **DYNAMIC:** Not cacheable (should not appear for static blog)
- **BYPASS:** Cache bypassed (check configuration)

### Verifying Cache Behavior

1. **First request:** Should show `cf-cache-status: MISS`
2. **Second request:** Should show `cf-cache-status: HIT`
3. **After purge:** Should show `cf-cache-status: MISS` again

## Troubleshooting

### Cache Not Working

**Symptoms:** Every request shows `cf-cache-status: MISS`

**Solutions:**
1. Verify Cache-Control headers are set correctly
2. Check Cloudflare caching level (should be "Standard" or "Aggressive")
3. Ensure no cache-busting query parameters
4. Check for conflicting Page Rules

### Stale Content After Update

**Symptoms:** New blog post not visible to visitors

**Solutions:**
1. Purge cache via dashboard or API
2. Wait 1-2 minutes for purge to propagate
3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Check if cache headers were accidentally changed

### Browser Cache Too Aggressive

**Symptoms:** Users not seeing updates even after cache purge

**Solutions:**
1. Reduce `max-age` for HTML pages
2. Instruct users to hard refresh
3. Consider using `stale-while-revalidate` directive
4. Add cache-busting query parameters for critical updates

## Best Practices

1. **Always purge after deploy:** Make cache purging part of your deployment workflow
2. **Test before deploy:** Use `npm run preview` to test locally
3. **Monitor cache hit rate:** Check Cloudflare Analytics for cache performance
4. **Document changes:** Keep this file updated when modifying caching strategy
5. **Use immutable for hashed assets:** Next.js handles this automatically for `/_next/static/`
6. **Avoid query parameters:** They can bypass cache or create duplicate cache entries

## Future Optimizations

### Potential Improvements

1. **Implement cache tags:** Group related content for selective purging
2. **Add stale-while-revalidate:** Serve stale content while fetching fresh in background
3. **Use Cloudflare Workers KV:** Cache API responses or computed data
4. **Implement tiered caching:** Different cache durations for different content types
5. **Add cache warming:** Pre-populate edge cache after deploy

### Monitoring

Consider adding:
- Cache hit rate tracking
- Origin request monitoring
- Performance metrics (TTFB, LCP)
- Cache purge logging

## References

- [Cloudflare Cache Documentation](https://developers.cloudflare.com/cache/)
- [HTTP Caching (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Cache-Control Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [OpenNext Cloudflare Adapter](https://opennext.js.org/cloudflare)
