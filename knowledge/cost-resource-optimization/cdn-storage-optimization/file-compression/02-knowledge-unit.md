# KU-04-FILE-COMPRESSION: File Compression

## Metadata
- **ID**: KU-04-FILE-COMPRESSION
- **Subdomain**: CDN & Storage Optimization
- **Topic**: File Compression
- **Source**: CDN & Storage Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Compression reduces data transfer volume, lowering CDN and network costs while improving load times. CloudFront supports automatic compression (gzip/brotli) for text-based responses. For Laravel, enabling compression on HTML, CSS, JS, and JSON reduces data transfer by 60-80%. Pre-compressed assets in S3 further reduce origin CPU usage.

## Core Concepts
- **CloudFront automatic compression**: CloudFront compresses at edge; supported file types: html, css, js, json, xml, svg
- **Brotli vs gzip**: Brotli (br) compresses 20% better than gzip at same quality; CloudFront supports both with Accept-Encoding negotiation
- **Pre-compression**: Compress assets at build time and store both .gz and .br versions in S3; CloudFront serves based on Accept-Encoding
- **Compression ratio**: Text files 60-80% reduction; images/PDFs unchanged (already compressed)

## Mental Models
- Default: enable CloudFront automatic compression for all text types
- For S3 origins, recommend pre-compression in CI/CD pipeline
- Warn against BREACH attack risk for sensitive pages

## Internal Mechanics
- CloudFront compression adds <1ms per edge request (negligible)
- Pre-compressed S3 assets serve in 0ms compression overhead (already compressed)
- Network transfer reduction: 60-80% for text, saving $0.05-0.07/GB transferred
- Brotli quality level 5 (CloudFront default) balances speed and compression well

## Patterns
- Enable CloudFront automatic compression
- Pre-compress assets in S3 during build
- Set correct Content-Type
- Use Brotli with gzip fallback

## Architectural Decisions
- CloudFront compression is free; always enable it in distribution settings
- For high-traffic S3 origins, pre-compress during CI/CD build step
- Set `Accept-Encoding: br, gzip` handling to automatic in CloudFront
- Enable compression both at origin (ALB/Nginx) and at CDN level as fallback
- For Laravel Octane, compression at Nginx level (not app level) to avoid CPU overhead per request

## Tradeoffs
**When To Use:**
- CloudFront compression: Always for text-based responses (HTML, CSS, JS, JSON, XML, SVG, fonts)
- Pre-compression: For high-traffic S3 origins when you want to minimize CloudFront compute cost
- Image compression: Use WebP/AVIF at the edge (via Lambda@Edge or S3 transform)
- Brotli: When clients support it (all modern browsers); use both gzip as fallback

**When NOT To Use:**
- CloudFront compression: Do not enable for already-compressed binary files (images, video, archives) - wastes CPU with no benefit
- Pre-compression: Not needed for low-traffic apps (<10K requests/day); CloudFront on-the-fly compression is sufficient and free
- Compression for API responses: JSON is text and should be compressed; but if API response time is critical, compression adds 1-5ms CPU overhead on small payloads

## Performance Considerations
- CloudFront compression adds <1ms per edge request (negligible)
- Pre-compressed S3 assets serve in 0ms compression overhead (already compressed)
- Network transfer reduction: 60-80% for text, saving $0.05-0.07/GB transferred
- Brotli quality level 5 (CloudFront default) balances speed and compression well

## Production Considerations
- Compression ratio can be used in BREACH attack; disable compression for pages containing CSRF tokens or sensitive data
- Do not compress responses with user secrets (CSRF tokens, API keys in HTML)
- Compression does not affect encryption; TLS + compressed is safe

## Common Mistakes
- **Not enabling CloudFront compression**: Relying on origin compression only for S3-served assets (Cause: assuming compression must be configured at origin; Consequence: S3 doesn't compress on-the-fly; uncompressed data transfer costs 3-5x more; Better: enable CloudFront automatic compression)
- **Compressing images at CDN level**: CloudFront tries gzip on JPEG/PNG (Cause: enabling "Compress objects automatically" without filtering types; Consequence: wasted CPU with 0-2% size reduction; Better: CloudFront only compresses text types by default; don't override)
- **No Accept-Encoding handling**: Origin returns uncompressed content regardless of client headers (Cause: Nginx/Apache not configured for gzip; Consequence: full data transfer costs 3-5x; Better: configure Nginx gzip on, or let CloudFront handle it)

## Failure Modes
- **Double compression**: Pre-compressing in build AND enabling CloudFront compression; CloudFront decompresses then recompresses (waste)
- **Application-level compression**: Using PHP/Laravel gzip middleware (adds CPU overhead per request; let Nginx/CloudFront handle it)
- **Not compressing API responses**: JSON payloads compress 70-80%; skipping compression on high-volume APIs wastes bandwidth

## Ecosystem Usage
- **S3 asset pre-compression**: Build script outputs `app.a1b2.js.gz` and `app.a1b2.js.br` alongside original; CloudFront negotiates Accept-Encoding
- **CloudFront-only compression**: Checkbox in distribution -> "Compress objects automatically" -> accepts gzip/brotli
- **Nginx fallback**: `gzip on; gzip_types text/css application/javascript image/svg+xml;` for ALB origin

## Related Knowledge Units
- CDN Integration (ku-01)
- Cache Control Headers (ku-03)
- Image Optimization (ku-05)

## Research Notes
Derived from CDN & Storage Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.