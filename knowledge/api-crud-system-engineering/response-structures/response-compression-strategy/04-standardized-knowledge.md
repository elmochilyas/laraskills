# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Response Compression Strategy
**Difficulty:** Intermediate
**Category:** Response Structures
**Last Updated:** 2026-06-03

---

# Overview

Response Compression Strategy is the approach to compressing API response bodies to reduce bandwidth usage — typically using gzip or brotli compression at the web server or CDN level. It exists because JSON responses can be large, especially for list endpoints, and compression typically reduces payload size by 70-90%.

Engineers must care because response compression is one of the highest-impact, lowest-effort performance optimizations available. Enabling compression requires minimal configuration and dramatically reduces bandwidth costs and response times for consumers, especially on mobile networks.

---

# Core Concepts

**gzip:** The most widely supported compression algorithm. Supported by all HTTP clients and servers.

**Brotli:** A newer compression algorithm with better ratios than gzip. Supported by most modern browsers and HTTPS clients.

**Compression Level:** Tradeoff between compression ratio and CPU time. Level 1 (fastest) vs Level 11 (best compression).

**Content Negotiation:** Client specifies acceptable encoding via `Accept-Encoding` header. Server responds with `Content-Encoding`.

**CDN Compression:** CDNs typically handle compression at the edge, reducing origin server load.

**Pre-compression:** Compressing static responses at build time. Not applicable for dynamic API responses.

---

# When To Use

- Any API with response bodies >1KB
- APIs with mobile consumers (bandwidth-constrained)
- High-traffic APIs where bandwidth costs matter
- List endpoints returning large JSON arrays

---

# When NOT To Use

- Extremely small responses (<1KB) where compression overhead exceeds savings
- Streaming responses where compression would introduce latency
- Internal APIs on high-bandwidth networks (diminishing returns)

---

# Best Practices

**Let the web server or CDN handle compression.** Nginx and CDNs compress responses more efficiently than PHP.

**Use brotli where supported.** Brotli provides 20-30% better compression than gzip for JSON.

**Set appropriate compression levels.** Level 1-3 is usually sufficient. Higher levels use more CPU for marginal gains.

**Verify compression is working.** Monitor `Content-Encoding` headers in responses.

**Test compression latency impact.** Compression adds CPU time. Ensure the bandwidth savings outweighs the latency cost.

---

# Architecture Guidelines

**Compression is an infrastructure concern, not an application concern.** Configure at the web server or CDN layer.

**PHP-level compression (via output buffering) is a fallback.** Use only when web server compression is unavailable.

**API responses should indicate compressibility via headers.** `Cache-Control: public` responses are more compressible than dynamic responses.

**Compression should not affect API contract.** The response structure is identical; only the wire format changes.

---

# Performance Considerations

**Compression typically reduces JSON response size by 70-90%.** A 100KB response becomes 10-30KB.

**Compression adds CPU time at the server and decompression time at the client.** Typically 5-20ms added for compression.

**Brotli is slower than gzip to compress but faster to decompress.** Good for APIs where responses are consumed frequently.

**Compression is most effective on text-based formats (JSON, XML).** Binary formats (MessagePack, Protocol Buffers) don't compress as well.

---

# Security Considerations

**Compression combined with TLS may expose BREACH vulnerability.** Attackers can infer response content through compression ratio changes. Mitigate with response padding.

**CDN compression may bypass origin security controls.** Ensure CDN enforces the same security policies as origin.

**Compression should not be applied to encrypted responses.** Encrypted data is incompressible.

---

# Common Mistakes

**No compression configured.** Responses sent uncompressed, wasting bandwidth.

**PHP-level compression without web server compression.** PHP compression adds overhead without the performance benefits of nginx/CDN-level compression.

**Compression level set too high.** Level 9 compression uses 10x more CPU than level 1 for only 5% more compression.

**Brotli without fallback.** Some clients don't support brotli. Always provide gzip fallback.

---

# Anti-Patterns

**PHP Output Buffering Compression:** Using `ob_gzhandler()` in PHP instead of web server-level compression.
**Better approach:** Configure compression at the web server or CDN layer for better performance.

**Pre-Compression of Dynamic Responses:** Attempting to pre-compress API responses at build time.
**Better approach:** API responses are dynamic — compress on-the-fly at the web server.

**Compression Level Over-Optimization:** Setting gzip level 9 for all responses, adding CPU time for marginal compression gain.
**Better approach:** Level 1-3 is sufficient. Higher levels rarely justify the CPU cost.
