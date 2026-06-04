# Skill: Implement Response Compression Strategy

## Purpose
Configure response compression for API payloads using gzip/brotli compression at web server or middleware layer, with appropriate content negotiation via `Accept-Encoding` headers.

## When To Use
- APIs with large JSON responses
- Bandwidth-constrained consumers (mobile, IoT)
- Public APIs where payload size affects latency

## When NOT To Use
- Small payloads (<1KB) — compression adds overhead
- Already-compressed content (images, archives)
- Serverless environments where compression is handled by CDN

## Prerequisites
- Web server (Nginx/Apache) or middleware compression
- Compression library availability

## Inputs
- Compression configuration per content type
- Compression level preference

## Workflow
1. Enable compression at web server level (Nginx `gzip on;`, Caddy `encode gzip`) — most efficient
2. If no web server compression, use middleware: `spatie/laravel-http-compression` or custom
3. Configure minimum content length for compression: 1KB default
4. Set compression level: 6 (balanced) for most workloads
5. Configure `Content-Encoding` response header matching client `Accept-Encoding`
6. Vary response based on `Accept-Encoding` — set `Vary: Accept-Encoding` header
7. Exclude SSE and streaming responses from compression
8. Test compressed response size reduction — target 70-80% reduction for JSON
9. Monitor CPU usage increase from compression — significant at high throughput
10. Consider CDN-level compression (CloudFlare, CloudFront) as alternative

## Validation Checklist
- [ ] Compression at web server or middleware level
- [ ] Minimum content length configured (1KB)
- [ ] Compression level set (6)
- [ ] `Content-Encoding: gzip` or `br` in response headers
- [ ] `Vary: Accept-Encoding` header present
- [ ] SSE/streaming responses excluded from compression
- [ ] JSON payload size reduction verified (70-80%)
- [ ] CPU impact monitored
- [ ] CDN compression considered where applicable
- [ ] Works with all HTTP methods and response types

## Common Failures
- Double compression — web server and middleware both compress, inefficient
- No `Vary: Accept-Encoding` — cached response served to wrong client (compressed to non-supporting)
- Compressing small responses — overhead > savings for <1KB
- Compressing already-compressed content — wasted CPU
- No minimum length — all responses compressed regardless of size
- SSE compressed — breaks real-time streaming
- Brotli not supported on all CDNs/old clients — keep gzip fallback

## Decision Points
- Web server vs middleware compression — web server is more efficient
- gzip vs brotli — brotli for smaller size, gzip for wider compatibility
- Compression level — 6 for balanced, 9 for max compression (slower), 1 for speed

## Performance Considerations
- Compression at level 6 reduces JSON payloads by 70-80%
- Compression adds 1-5ms CPU time per response depending on payload size
- Uncompressed responses are faster to serve but use more bandwidth
- CDN compression reduces origin server load
- Brotli at level 6 is slightly slower than gzip but produces ~15% smaller output

## Security Considerations
- Compression ratio must not enable BREACH attack — disable compression on responses with sensitive data in URL/cookies
- `Vary: Accept-Encoding` prevents cache serving wrong encoding
- Compressed responses may bypass certain security inspection tools
- Ensure compression doesn't enable CRIME/BREACH — sensitive APIs should assess risk

## Related Rules
- Enable Compression At Web Server Level
- Minimum Content Length For Compression
- Set Vary: Accept-Encoding Header
- Exclude SSE From Compression
- Verify JSON Compression Ratio
- Monitor CPU Impact of Compression

## Related Skills
- Cache Header Strategy — for caching compressed responses
- Response Envelope Design — for compressible envelope structure
- CDN Caching Strategy — for CDN-level compression

## Success Criteria
- JSON responses compressed with correct `Content-Encoding`
- `Vary: Accept-Encoding` ensures correct cache behavior
- 70-80% reduction in JSON payload size
- No double compression
- Small responses (<1KB) not compressed
- SSE and streaming responses correctly excluded
- CPU impact acceptable for traffic volume
