# Decision Trees: Response Compression Strategy

## Tree 1: Compression Layer

```
Where should compression be applied?
├── Web server available (Nginx, Caddy, Apache) → Configure at web server level
├── Using CDN (Cloudflare, CloudFront, Fastly) → Enable CDN-level compression, skip origin compression
├── Serverless environment → Use CDN or middleware-level compression (spatie/laravel-http-compression)
└── No web server or CDN → PHP output buffering compression (fallback only)
```

## Tree 2: Compression Algorithm Selection

```
What clients does your API serve?
├── Modern browsers and HTTP/2 clients → Brotli with gzip fallback. Brotli is 20-30% better for JSON.
├── Wide range of clients (mobile, IoT, legacy) → gzip only. Universal support.
├── API-to-API (server-side) → gzip. Less CPU overhead, sufficient compression.
└── Internal services on high-bandwidth network → No compression needed. Overhead not worth savings.
```

## Tree 3: Compression Level

```
What is your performance priority?
├── Minimize CPU usage → Level 1-3. Fastest compression, 60-70% reduction.
├── Balanced (recommended) → Level 4-6. Good compression, moderate CPU cost.
├── Minimize bandwidth → Level 7-9. Maximum compression, 10x more CPU for 5% more reduction.
└── Mixed workload → Level 6 default. Adjust per-endpoint if needed.
```

## Tree 4: Response Size Threshold

```
What is the typical response body size?
├── < 1KB → Skip compression. Overhead exceeds savings.
├── 1KB - 10KB → Compress with minimum threshold of 1KB.
├── 10KB - 100KB → Always compress. 70-90% reduction typical.
├── 100KB+ → Always compress. Consider pagination or field selection to reduce base size.
└── Variable → Set minimum content length of 1KB. Compress only responses exceeding threshold.
```

## Tree 5: Endpoint Compressibility

```
What type of data does this endpoint return?
├── JSON, XML, text → Highly compressible. Enable compression.
├── Already compressed (images, archives) → Skip compression. No benefit.
├── Streaming (SSE, WebSocket) → Skip compression. Breaks streaming.
├── Encrypted response → Skip compression. Encrypted data is incompressible.
└── Sensitive data over HTTPS → Assess BREACH risk. Disable if risk is unacceptable.
```
