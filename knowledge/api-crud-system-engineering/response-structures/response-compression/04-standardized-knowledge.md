# response-compression

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: response-compression
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Response compression reduces the size of API response payloads by encoding the body with algorithms like gzip, brotli, or deflate before transmission. The `Content-Encoding` response header tells the client which algorithm was used, and the client decodes the body automatically. Compression is the single most effective optimization for reducing API response bandwidth, typically achieving 70-90% size reduction for JSON responses.

Server-level compression (Nginx, HAProxy) is strictly superior to application-level compression — it offloads CPU-intensive compression to the web server layer, keeps application code simpler, and avoids double-compression risks.

## Core Concepts
- **Content-Encoding Header**: Response header indicating the encoding algorithm — `gzip`, `br` (brotli), `deflate`, `identity` (no encoding).
- **Accept-Encoding Header**: Request header listing supported compression algorithms. Server selects the best supported algorithm.
- **Gzip**: Most widely supported algorithm. Compresses JSON to 10-30% of original size. Universal client support.
- **Brotli**: Newer algorithm (RFC 7932) offering 10-20% better compression than gzip at the cost of higher CPU usage for compression. Decompression is fast on all clients.
- **Compression Level**: Algorithms offer configurable levels (1-9 for gzip, 0-11 for brotli). Level 5-6 is the sweet spot for gzip; level 4-6 for brotli.
- **Compression Threshold**: Minimum response size eligible for compression (typically 1KB). Tiny responses don't benefit.
- **Dynamic vs. Static Compression**: Dynamic applies on-the-fly per request. For API responses, only dynamic compression is relevant.

## When To Use
- APIs serving mobile clients over cellular networks (bandwidth-constrained)
- Public APIs where response payloads frequently exceed 1KB
- High-traffic APIs where bandwidth costs are significant
- APIs returning large collections or compound documents
- APIs consumed by browsers (universal gzip/brotli support)

## When NOT To Use
- Internal microservices on low-latency networks where CPU is the bottleneck
- Endpoints returning tiny responses (under 1KB) — compression overhead exceeds savings
- Streaming responses (SSE, WebSocket) — compression adds latency via buffering
- Endpoints where BREACH attack is a concern (responses combining user input with secrets)
- CPU-bound applications where 5-10% additional CPU per request is unacceptable

## Best Practices (WHY)
- **Compress at the server level, not application level**: Nginx gzip is C-based and faster than PHP-based compression. It also avoids the risk of double-compressing when both layers are enabled.
- **Set a compression threshold of 1KB**: Responses under 1KB often grow after compression due to header overhead. Check `gzip_min_length 1000` in Nginx.
- **Use gzip for general-purpose APIs, brotli for browser-facing**: Brotli has better compression but many HTTP clients and SDKs don't support it. Gzip has universal support.
- **Default to compression level 5-6**: Level 9 provides <2% better compression than level 6 but uses 3x more CPU. The marginal gain is not worth the cost.
- **Explicitly add JSON to compression types**: Default Nginx configs often only compress HTML, CSS, and JS. Add `gzip_types application/json` explicitly.

## Architecture Guidelines
- Prefer server-level compression (Nginx, Caddy, HAProxy) — it offloads compression from PHP, keeps code simple, and prevents double-compression.
- If using application-level compression, use middleware that checks `Accept-Encoding` and applies compression selectively.
- Generate ETags on the uncompressed body, then compress — compressed bytes differ from uncompressed bytes, and ETags should represent content identity, not wire format.
- Cache the compressed response body rather than compressing on every cache hit — eliminates repeated compression CPU cost.
- In CDN architectures (Cloudflare, Fastly), send uncompressed content from origin and let the CDN handle compression at the edge.
- For Laravel Vapor (Lambda + API Gateway), compression is handled by API Gateway or CloudFront automatically — no application code changes needed.

## Performance
- Compression reduces bandwidth by 70-90% but increases CPU usage by 5-10% for gzip level 5.
- A 10KB response compresses in ~0.5ms; a 1MB response compresses in ~50ms at gzip level 5.
- gzip uses ~256KB memory per compression stream. At 256 concurrent requests, that's 64MB for compression buffers.
- Client decompression is 2-5x faster than compression — the time saved from downloading less data usually outweighs decompression time.
- Cached compressed responses avoid re-compression entirely — CPU cost is eliminated on cache hits.

## Security
- **BREACH attack**: Compression combined with user-controlled input in responses enables BREACH attacks. Disable compression for endpoints that include user secrets in the response body (CSRF tokens, session IDs).
- Double compression wastes CPU and can corrupt payloads — ensure only one layer handles compression.
- Legacy HTTP clients may not handle `Content-Encoding` — check `Accept-Encoding` before compressing and skip if unsupported.
- Monitor compression ratios per endpoint — a dropping ratio may indicate content-type changes or misconfiguration.
- During development, use `Accept-Encoding: identity` to inspect uncompressed response bodies.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Double compression | Enabling compression at both application and web server | Not understanding the compression layer | Wasted CPU, potentially corrupted payload | Compress only at the server level; disable application-level compression |
| No compression on JSON | Default Nginx gzip only compresses HTML/CSS/JS | Not configuring `gzip_types` | JSON responses never compressed | Add `gzip_types application/json;` to Nginx config |
| Overly aggressive level | Using gzip level 9 for all responses | Assuming more compression is always better | 3x CPU for <2% additional compression | Use level 5-6 for the best CPU-to-compression ratio |
| Compressing streaming responses | Applying compression to SSE or WebSocket | Generic compression middleware | Increased latency from buffering | Skip compression for streaming responses |
| Compressing tiny responses | Compressing sub-1KB responses | No compression threshold | Larger payload due to compression header overhead | Set `gzip_min_length 1000;` |
| Skipping mobile compression | Not compressing for mobile clients | Assuming mobile has sufficient bandwidth | Slow UX on cellular networks | Mobile benefits most from compression — always compress |
| Brotli for general API | Using brotli only for API consumed by diverse HTTP clients | Assuming universal brotli support | Older SDKs cannot decompress | Use gzip for general API; brotli for browser-targeted |

## Anti-Patterns
- **Application-Level Compression Without Cache**: Compressing on every request without caching the compressed payload. Cache the compressed body.
- **Compression Middleware Before Authentication**: Compressing responses before authentication middleware runs. Authentication headers should not be compressed when checking credentials.
- **Brotli-Only Compression**: Using only brotli and not falling back to gzip. Clients without brotli support get uncompressed responses.
- **Compressing Static Files on Every Request**: Letting PHP compress static JSON responses rather than serving pre-compressed `.json.gz` files.
- **No Compression Monitoring**: Deploying compression without monitoring ratios, CPU impact, or client compatibility.

## Examples
```nginx
# Nginx server-level compression configuration
gzip on;
gzip_types application/json application/vnd.api+json application/problem+json;
gzip_min_length 1000;
gzip_comp_level 5;
gzip_vary on;
gzip_proxied any;

# Brotli (requires ngx_brotli module)
brotli on;
brotli_types application/json application/vnd.api+json application/problem+json;
brotli_min_length 1000;
brotli_comp_level 5;
```

```bash
# Verify compression is working
curl -H "Accept-Encoding: gzip" -I https://api.example.com/users
# Response should include: Content-Encoding: gzip

# View compressed response size vs uncompressed
curl -H "Accept-Encoding: gzip" -o /dev/null -w "%{size_download}" https://api.example.com/users
curl -H "Accept-Encoding: identity" -o /dev/null -w "%{size_download}" https://api.example.com/users
```

## Related Topics
- **Prerequisites**: envelope-response-design
- **Related**: response-caching-headers
- **Advanced**: response-versioning

## AI Agent Notes
- Configure compression at the server level (Nginx), not in PHP application code.
- Add `application/json` and `application/vnd.api+json` to `gzip_types`.
- Set `gzip_min_length 1000` and `gzip_comp_level 5` as defaults.
- Never compress streaming responses (SSE, WebSocket).
- Disable compression on endpoints vulnerable to BREACH attacks (those including user input with secrets in the response).
- Verify compression with `curl` before deploying.

## Verification
- `Content-Encoding: gzip` or `Content-Encoding: br` is present in response headers when `Accept-Encoding` includes the algorithm.
- `Content-Encoding: identity` (or absent) for responses under 1KB.
- No double compression — response can be decompressed correctly once.
- JSON content types (`application/json`, `application/vnd.api+json`, `application/problem+json`) are compressed.
- Compression ratio is 70-90% for typical JSON responses.
- Endpoints with streaming responses (SSE, WebSocket) are not compressed.
- BREACH-vulnerable endpoints (user input + secrets in response) have compression disabled.
