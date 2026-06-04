# CloudFront Compression Rules

## Rule 1: Enable CloudFront Automatic Compression
- **Category**: Cost Management
- **Rule**: Always enable CloudFront automatic compression for text-based content types
- **Reason**: Compression reduces data transfer by 60-70% for HTML, CSS, JS, JSON, XML, SVG; CloudFront compression is free; single toggle with no ongoing cost
- **Bad Example**: Serving uncompressed CSS and JS through CloudFront; a 100KB file stays 100KB over the wire
- **Good Example**: Enabling `compress: true` in CloudFront distribution; same 100KB file serves as ~30KB compressed
- **Exceptions**: Binary content (images, video, PDFs, archives) is already compressed and should not be re-compressed
- **Consequences Of Violation**: 3-5x higher data transfer costs for compressible content; slower page load times

## Rule 2: Enable Compression at CloudFront Level, Not Origin
- **Category**: Performance
- **Rule**: Configure compression at the CloudFront distribution level rather than expecting origin compression
- **Reason**: S3 does not compress on-the-fly; compression at CloudFront level means only compressed bytes traverse from edge to user, and compressed content is cached at edge
- **Bad Example**: Relying on S3 to serve compressed content; S3 does not support on-the-fly compression
- **Good Example**: Enabling CloudFront automatic compression; CloudFront compresses content once at edge and serves compressed versions to all users
- **Exceptions**: Pre-compressed assets in S3 (`.gz` and `.br` files) can be served directly, avoiding CloudFront CPU overhead
- **Consequences Of Violation**: Uncompressed data transfer for S3-origin content; 3-5x higher egress costs

## Rule 3: Pre-Compress Static Assets in CI/CD
- **Category**: Performance
- **Rule**: Pre-compress static assets during build step and store both `.gz` and `.br` versions in S3
- **Reason**: Avoids CloudFront CPU overhead for compression of frequently-requested static assets; S3 serves pre-compressed files directly with zero compression latency
- **Bad Example**: CloudFront compressing the same `app.js` on-the-fly for every cache miss (repeated CPU usage)
- **Good Example**: Build script outputs `app.a1b2.js`, `app.a1b2.js.gz`, `app.a1b2.js.br`; CloudFront serves pre-compressed version based on Accept-Encoding header
- **Exceptions**: Low-traffic apps (<10K requests/day) where CloudFront on-the-fly compression is sufficient and free
- **Consequences Of Violation**: Unnecessary CloudFront compute overhead for compressing static assets on every cache miss

## Rule 4: Ensure Correct Content-Type Headers
- **Category**: Maintainability
- **Rule**: Set proper Content-Type headers on all S3 objects to enable CloudFront compression
- **Reason**: CloudFront checks Content-Type before compressing; files with incorrect or missing content types will not be compressed
- **Bad Example**: JavaScript files served with Content-Type: application/octet-stream; CloudFront does not compress them
- **Good Example**: Setting Content-Type: application/javascript, text/css, text/html, application/json on respective files
- **Exceptions**: Binary files that should not be compressed should have correct non-text content types
- **Consequences Of Violation**: Files not compressed despite CloudFront compression being enabled; wasted savings opportunity
