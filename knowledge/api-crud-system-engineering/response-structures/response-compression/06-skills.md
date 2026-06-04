# Skill: Compress Large API Responses to Reduce Bandwidth
## Purpose
Enable response compression (gzip, brotli) for large JSON payloads to reduce bandwidth usage and improve perceived response time for clients with limited bandwidth.
## When To Use
Large JSON responses (>1KB); mobile clients or slow networks; responses with many repeated field names (JSON lists); bandwidth-constrained environments.
## When NOT To Use
Very small responses (<1KB) where compression overhead dominates; streaming responses (SSE, file downloads); responses already optimized (sparse fieldsets, pagination).
## Prerequisites
Web server configuration (Nginx, Apache); application-level compression (Laravel middleware); understanding of `Accept-Encoding` header.
## Inputs
Response body; `Accept-Encoding` header from client; minimum response size threshold.
## Workflow
1. Check `Accept-Encoding` header for supported compression algorithms (gzip, deflate, br)
2. If response body exceeds the minimum size threshold (e.g., 1KB), compress it
3. Choose the preferred algorithm from the client's `Accept-Encoding` (brotli > gzip)
4. Set `Content-Encoding` header to the chosen algorithm
5. Set `Vary: Accept-Encoding` header for CDN caching
6. Configure web server (Nginx) compression as the primary method
7. Use application-level compression middleware as fallback (e.g., `\Fruitcake\Cors\HandleCors`)
8. Exclude EventSource/SSE endpoints from compression
## Validation Checklist
- [ ] `Content-Encoding` header is set on compressed responses
- [ ] `Vary: Accept-Encoding` header is set for cache correctness
- [ ] Responses under threshold (1KB) are not compressed
- [ ] SSE and streaming endpoints are excluded from compression
- [ ] Nginx/apache compression is enabled with sensible buffer sizes
- [ ] Brotli is preferred over gzip when both are supported
- [ ] Compression ratio is monitored (expect 5-10x for JSON)
- [ ] No double compression (application + web server both compressing)
## Common Failures
- Compressing SSE or streaming responses — breaks the stream
- Double compression (middleware + web server) — corrupts response
- Not setting `Vary: Accept-Encoding` — CDN serves compressed to clients that don't support it
- Compressing tiny responses — overhead outweighs benefit
- Forgetting to verify `Accept-Encoding` — wastes CPU on clients that don't support it
## Decision Points
- Web server compression (Nginx `gzip on;`) vs PHP middleware compression
- Brotli (better ratio) vs gzip (wider support)
- Compression level tradeoff: higher ratio = more CPU, slower response
## Performance/Security Considerations
Compression reduces bandwidth 5-10x but increases CPU usage. Use web server compression for static content and PHP middleware for dynamic. Security: compression + sensitive data = BREACH attack risk — disable compression on responses containing secrets or CSRF tokens.
## Related Rules/Skills
Response Format Decision Framework; Sparse Fieldset Design; Response Size Optimization; Content Negotiation.
## Success Criteria
Large responses are compressed automatically; clients receive correct `Content-Encoding` header; no double compression; SSE/streaming endpoints are excluded.
