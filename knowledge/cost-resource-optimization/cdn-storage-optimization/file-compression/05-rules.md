# File Compression Rules

## Rule 1: Enable CloudFront Automatic Compression
- **Category**: Cost Management
- **Rule**: Always enable CloudFront automatic compression for all text-based content types
- **Reason**: Compression reduces data transfer by 60-80% for HTML, CSS, JS, JSON, XML, SVG; CloudFront compression is free; it is a single toggle with no ongoing maintenance
- **Bad Example**: Serving uncompressed CSS/JS through CloudFront; a 150KB bundle remains 150KB over the wire
- **Good Example**: Enabling "Compress objects automatically" in CloudFront; same 150KB bundle serves as ~35KB compressed
- **Exceptions**: Already-compressed binary content (images, video, archives) should not be re-compressed
- **Consequences Of Violation**: 3-5x higher data transfer costs for compressible text content

## Rule 2: Pre-Compress Assets in CI/CD Pipeline
- **Category**: Performance
- **Rule**: Generate gzip and Brotli compressed versions of static assets during the build step and store them in S3
- **Reason**: Avoids CloudFront CPU compression overhead for frequently-requested static assets; pre-compressed files serve with zero compression latency
- **Bad Example**: CloudFront compressing `app.js` on-the-fly on every cache miss, consuming edge compute resources
- **Good Example**: Build script outputs `app.a1b2.js`, `app.a1b2.js.gz`, `app.a1b2.js.br`; S3 serves pre-compressed files based on Accept-Encoding header
- **Exceptions**: Low-traffic apps (<10K requests/day) where CloudFront on-the-fly compression is sufficient
- **Consequences Of Violation**: Unnecessary CloudFront compute overhead; negligible for most apps but relevant at scale

## Rule 3: Support Brotli with Gzip Fallback
- **Category**: Performance
- **Rule**: Configure both Brotli and gzip compression with automatic negotiation based on Accept-Encoding header
- **Reason**: Brotli compresses 20% better than gzip but is not supported by very old clients; offering both ensures optimal compression for modern browsers and compatibility for legacy
- **Bad Example**: Supporting only gzip compression; Brotli-capable browsers receive files 20% larger than necessary
- **Good Example**: CloudFront automatically negotiates Brotli (priority) -> gzip (fallback) based on Accept-Encoding header
- **Exceptions**: The Accept-Encoding negotiation is automatic in CloudFront; no additional configuration needed beyond enabling compression
- **Consequences Of Violation**: 20% higher data transfer for modern browsers that support Brotli

## Rule 4: Avoid Double Compression
- **Category**: Performance
- **Rule**: Do not pre-compress assets AND enable CloudFront compression on the same objects
- **Reason**: CloudFront may decompress pre-compressed origin content and re-compress it, negating the benefit of pre-compression and adding CPU overhead
- **Bad Example**: Storing `app.js.gz` in S3 AND enabling CloudFront automatic compression; CloudFront decompresses the gzip from S3, then re-compresses with gzip
- **Good Example**: Either pre-compress in build (store .gz/.br in S3 with correct Content-Encoding) OR enable CloudFront compression, not both
- **Exceptions**: If CloudFront is configured to pass through pre-compressed files (correct Content-Encoding), it will not re-compress
- **Consequences Of Violation**: Wasted build time for pre-compression; wasted CloudFront CPU for decompression/re-compression

## Rule 5: Disable Compression for Pages with Sensitive Data
- **Category**: Security
- **Rule**: Disable compression for responses containing CSRF tokens, API keys, or user secrets
- **Reason**: Compression ratio can be exploited in BREACH attack to extract secrets from encrypted HTTPS responses
- **Bad Example**: Compressing HTML pages containing CSRF tokens; attacker can use BREACH to extract the token
- **Good Example**: Disabling compression for sensitive pages or using CSRF token rotation per-request as mitigation
- **Exceptions**: Most applications are not vulnerable to BREACH; the attack requires MITM position and is rare
- **Consequences Of Violation**: Theoretical risk of CSRF token extraction via BREACH attack at extremely high scale
