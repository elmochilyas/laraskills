# response-compression
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** response-compression  
**Difficulty Level:** Intermediate  
**Last Updated:** 2026-06-02

## Executive Summary
Response compression reduces the size of API response payloads by encoding the body with algorithms like gzip, brotli, or deflate before transmission. The `Content-Encoding` response header tells the client which algorithm was used, and the client decodes the body automatically. Compression is the single most effective optimization for reducing API response bandwidth, typically achieving 70-90% size reduction for JSON responses. In Laravel, compression is typically handled at the web server level (Nginx, Apache) or via middleware, not in application code.

## Core Concepts
- **`Content-Encoding` Header**: A response header indicating the encoding algorithm applied to the body. Values: `gzip`, `br` (brotli), `deflate`, `identity` (no encoding).
- **`Accept-Encoding` Header**: A request header sent by the client listing which compression algorithms it supports. Server selects the best supported algorithm.
- **Gzip**: The most widely supported compression algorithm. Compresses JSON to 10-30% of original size. Slightly lower compression ratio than brotli but universal client support.
- **Brotli**: A newer compression algorithm (RFC 7932) offering 10-20% better compression than gzip at the cost of higher CPU usage for compression. Decompression is fast on all clients.
- **Compression Level**: Algorithms offer a compression level (1-9 for gzip, 0-11 for brotli). Higher levels compress better but use more CPU. Level 5-6 is the sweet spot for gzip; level 4-6 for brotli.
- **Dynamic vs. Static Compression**: Dynamic compression applies on-the-fly per request. Static compression pre-compresses files and serves them directly. For API responses, only dynamic compression is relevant.
- **Compression Buffer Size**: The minimum response size eligible for compression. Most servers only compress responses above a threshold (e.g., 1KB) to avoid compressing trivial payloads.

## Mental Models
- **Vacuum Bag**: Compression is like putting the response in a vacuum bag. The same content takes up much less space. The `Content-Encoding` header is the "remove air" label, and the client's decompressor is the vacuum opener.
- **Shipping Box vs. Content**: Compression is the shipping box around the response. The box takes effort to pack (compress) and unpack (decompress). The content inside (the JSON) is identical after unpacking.
- **Toll Booth**: The `Accept-Encoding` header is a toll booth where the client announces "I can read gzip." The server says "Great, I'll send you gzip." If the client doesn't announce, the server sends uncompressed.

## Internal Mechanics
- **Nginx Compression**: Nginx `gzip on;` enables gzip compression for eligible responses. `gzip_types application/json;` restricts compression to JSON. `gzip_min_length 1000;` sets the minimum response size.
- **Application-Level Compression**: Laravel middleware can compress responses using PHP's `ob_gzhandler()` or the `gzencode()` function. Application-level compression is less efficient than server-level.
- **Content Negotiation Flow**: Client sends `Accept-Encoding: gzip, br` → Server checks if compression is configured → Server selects best algorithm → Server compresses body → Server sets `Content-Encoding: br` → Client decompresses and processes.
- **Compression and ETags**: Compressed responses have different bytes than uncompressed. ETags generated after compression differ from ETags generated before compression. Generate ETags on the uncompressed body, then compress.
- **Brotli Support Detection**: Browsers send `br` in Accept-Encoding. PHP's brotli support requires the `ext-brotli` extension or a recent version of libcurl. Nginx supports brotli via the `ngx_brotli` module.
- **Transfer-Encoding**: For streaming responses, `Transfer-Encoding: chunked` can be combined with `Content-Encoding: gzip` for chunked compression. Rarely used in REST APIs.

## Patterns
- **Server-Level Compression (Recommended)**: Configure compression at the web server/reverse proxy level (Nginx, Caddy, HAProxy). This keeps the application server focused on business logic and offloads compression to the infrastructure layer.
- **Compression Threshold**: Only compress responses above a threshold (typically 1-2KB). Tiny responses (errors, simple status) don't benefit from compression and waste CPU cycles.
- **Brotli for Browsers, Gzip for APIs**: Browsers universally support brotli, but many HTTP clients and SDKs do not. For general-purpose APIs, prefer gzip. For browser-targeted APIs, use brotli with gzip fallback.
- **Pre-Compressed Static Responses**: For API documentation, specification files, or rarely-changing responses, pre-compress and store both `.json` and `.json.gz` files. Serve the compressed version when the client supports it.
- **Conditional Compression for Large Payloads**: Only compress responses exceeding a size threshold. The middleware checks `strlen($response->getContent())` before deciding to compress.
- **Cache Compressed Payloads**: Cache the compressed response body rather than compressing on every request. This eliminates the CPU cost of repeated compression.

## Architectural Decisions
- **Compression Layer (Server vs. Application)**: Server-level compression is simpler and faster (Nginx is C-based, optimized). Application-level compression gives more control (choose which endpoints, dynamic thresholds) but uses PHP CPU time.
- **Compression Algorithm Preference**: Gzip has universal support. Brotli has better compression. Deflate is obsolete. Choose gzip for public APIs, brotli for browser-facing endpoints.
- **Compression Level Tuning**: Higher levels save more bandwidth but use more CPU. The marginal gain from level 6 to 9 is typically <5% additional compression but 2-3x more CPU. Default to level 5-6.
- **Compression of Error Responses**: Small error responses (under 1KB) should not be compressed. The compression overhead exceeds the bandwidth savings.
- **Pre-Compression vs. On-the-Fly**: Pre-compression is impossible for dynamic API responses. Use on-the-fly compression but cache compressed results when possible.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| 70-90% bandwidth reduction | CPU usage increases for compression | 5-10% additional CPU per request for gzip level 5 |
| Faster client downloads (less data) | Latency added by compression time | gzip level 5 adds ~2-5ms for 100KB response |
| Lower bandwidth costs | Brotli not supported by all HTTP clients | Older SDKs may not decompress brotli |
| Improved user experience on slow networks | Larger responses may not benefit | Responses under 1KB often grow after compression (header overhead) |
| Works transparently with CDNs | CDN may re-compress with different settings | Double compression wastes resources |

## Performance Considerations
- **CPU vs. Bandwidth Tradeoff**: Compression reduces bandwidth by 70-90% but increases CPU usage by 5-10%. For CPU-bound applications, lower compression levels or skip compression. For bandwidth-bound applications, maximize compression.
- **Compression Time by Payload Size**: A 10KB response compresses in ~0.5ms. A 1MB response compresses in ~50ms at gzip level 5. For large responses, pre-compress or cache.
- **Memory Usage**: Compression buffers memory. gzip uses ~256KB per compression stream. For high-concurrency servers, this adds up: 256 concurrent requests × 256KB = 64MB for compression buffers.
- **Decompression Speed**: Client decompression is fast — typically 2-5x faster than compression. The client-side time saved from downloading less data usually outweighs the decompression time.
- **Cache Hit Impact**: Cached compressed responses avoid re-compression entirely. Cache the compressed payload to eliminate the CPU cost on cache hits.

## Production Considerations
- **Server Configuration**: Test that compression is enabled at the server level. Use `curl -H "Accept-Encoding: gzip" -I https://api.example.com/endpoint` and check for `Content-Encoding: gzip` in response headers.
- **Monitoring Compression Ratios**: Track the compression ratio (uncompressed size / compressed size) per endpoint. A dropping ratio may indicate content-type changes or misconfiguration.
- **Client Compatibility**: Some legacy HTTP clients cannot decompress gzip. Check `Accept-Encoding` and skip compression if the client does not support it.
- **Brotli in CDNs**: Cloudflare, Fastly, and Akamai all support brotli compression. Ensure the origin server sends uncompressed content to the CDN and lets the CDN handle compression.
- **Security: BREACH Attack**: Compression combined with user input in responses (CSRF tokens, etc.) enables BREACH attacks. Disable compression for endpoints that include user secrets in the response body.
- **Debugging Compressed Responses**: During development, disable compression or use `Accept-Encoding: identity` to inspect response bodies in human-readable form.

## Common Mistakes
- **Double Compression**: Enabling compression at both the application level and the web server level. The response is compressed twice, wasting CPU and potentially corrupting the payload.
- **Compressing Already Compressed Data**: Compressing the output of `Brotli` or `gzip` again provides no benefit and wastes resources. Check `Content-Encoding` before compressing.
- **No Compression on JSON Responses**: Default Nginx configurations often only compress HTML, CSS, and JS. Explicitly add `application/json` to `gzip_types`.
- **Overly Aggressive Compression Level**: Using gzip level 9 for all responses. Level 9 provides <2% better compression than level 6 but uses 3x more CPU.
- **Compressing WebSocket or SSE Streams**: Compression on streaming responses increases latency because the compressor must buffer the stream. Skip compression for streaming responses.
- **Skipping Compression for Mobile Clients**: Mobile clients benefit the most from compression due to slower cellular networks. Always compress for mobile.

## Failure Modes
- **Corrupted Compression**: A bug in the compression library or misconfigured middleware produces a corrupted compressed body. The client cannot decompress and receives a parse error. Always test compression end-to-end.
- **Compression Timeout**: Large responses (10MB+) take significant time to compress. If the server has a response timeout, the compression itself can trigger the timeout. Pre-compress or stream uncompressed.
- **Incompatible Client**: An old client that doesn't handle `Content-Encoding`. Send uncompressed or check `Accept-Encoding` strictly.
- **CDN Recompression Mismatch**: The CDN decompresses the response, modifies it, and recompresses with different settings. The client receives a valid response but with different encoding than expected.
- **BREACH Attack Exploitation**: An attacker exploits compression to extract secrets from responses that include user input. Disable compression on sensitive endpoints.

## Ecosystem Usage
- **Nginx**: The most common Laravel compression layer. `gzip on; gzip_types application/json; gzip_min_length 1000; gzip_comp_level 5;`. Brotli via `ngx_brotli` module.
- **Laravel Forge**: Forge provisions Nginx with gzip enabled by default. JSON is included in compression types.
- **Laravel Vapor**: AWS Lambda + API Gateway. Compression is handled by API Gateway or CloudFront. Lambda responses can be compressed with manual middleware.
- **Laravel Octane**: Responses from RoadRunner or Swoole can be compressed at the application level using middleware. Octane shares compression state across requests.
- **AWS CloudFront**: CloudFront supports both gzip and brotli compression. It compresses responses at the edge, reducing origin server load.
- **Cloudflare**: Automatically compresses responses with brotli or gzip. The origin server can send uncompressed content; Cloudflare handles compression.
- **Spatie/laravel-responsecache**: The cached response is stored in compressed form to save disk/memory and avoid re-compression on cache hits.

## Related Knowledge Units
### Prerequisites
- envelope-response-design

### Related Topics
- response-caching-headers

### Advanced Follow-up Topics
- response-versioning

---

## Research Notes

### Source Analysis
- HTTP/1.1 Content Encoding (RFC 7230 Section 3.1.2.2) — `Content-Encoding`, `Accept-Encoding`, `Transfer-Encoding`
- Nginx module `ngx_http_gzip_module` — server-level gzip configuration
- Nginx module `ngx_brotli` — brotli compression support
- `Illuminate\Http\Response` — `header()` for manual encoding headers
- AWS CloudFront/API Gateway — compression for Vapor-deployed Laravel

### Key Insight
Server-level compression (Nginx, HAProxy) is strictly superior to application-level compression — it offloads CPU-intensive compression to the web server layer, keeps application code simpler, and avoids double-compression risks.

### Version-Specific Notes
- Laravel 10/11/12/13: No native compression middleware in Laravel core
- Laravel Octane (Swoole/RoadRunner): Application-level compression may be needed since PHP-FPM + Nginx pattern changes
- Laravel Vapor: Compression handled by CloudFront or API Gateway automatically; no application code changes needed
- PHP `ext-brotli` not bundled with PHP — requires separate installation for application-level brotli
