# Cache Control Headers Rules

## Rule 1: Set Immutable Cache for Versioned Static Assets
- **Category**: Performance
- **Rule**: Use `Cache-Control: public, max-age=31536000, immutable` for all content-hashed static assets
- **Reason**: Hash changes when content changes; browser/CDN never re-requests until the file changes, achieving zero origin load for assets and fastest possible client caching
- **Bad Example**: Setting `max-age=3600` for `app.a1b2c3d4.js`; browsers revalidate every hour despite the URL being unique per version
- **Good Example**: `Cache-Control: public, max-age=31536000, immutable` on hashed assets; browser never re-requests until a new version is deployed
- **Exceptions**: Non-versioned files should never use `immutable`—they would never update
- **Consequences Of Violation**: Unnecessary browser revalidation of assets that will never change under the same URL

## Rule 2: Use ETag with no-cache for Dynamic Content
- **Category**: Performance
- **Rule**: Set `Cache-Control: no-cache` with ETag headers for cacheable API responses
- **Reason**: no-cache forces conditional requests; ETag enables 304 Not Modified responses (~500 bytes) vs full 200 responses (50KB-1MB), saving bandwidth while ensuring freshness
- **Bad Example**: Setting `Cache-Control: no-store` on a public API list endpoint that changes hourly; zero caching, full response every time
- **Good Example**: `Cache-Control: public, max-age=0, must-revalidate` + ETag; client sends conditional request, server returns 304 if unchanged
- **Exceptions**: User-specific API responses should use `private, no-store` to prevent data leakage
- **Consequences Of Violation**: Full response payloads sent on every request for content that has not changed

## Rule 3: Never Use immutable on Non-Versioned URLs
- **Category**: Maintainability
- **Rule**: Apply the `immutable` directive only to content-hashed filenames; never use it on static filenames like `style.css`
- **Reason**: If `style.css` has `immutable`, browsers will never re-fetch it even when the file content changes at the same URL
- **Bad Example**: Setting `Cache-Control: public, max-age=31536000, immutable` on `style.css`; after deployment with new styles, users still see old CSS for a year
- **Good Example**: `style.a1b2c3d4.css` (hashed) gets `immutable`; `style.css` (static) gets `max-age=3600`
- **Exceptions**: No exceptions—immutable without versioning creates unsolvable cache invalidation problems
- **Consequences Of Violation**: Users served stale CSS/JS for up to 1 year; broken UI after deploys

## Rule 4: Override CloudFront TTLs with Origin Headers
- **Category**: Architecture
- **Rule**: Set CloudFront Minimum TTL=0, Default TTL=86400, Maximum TTL=31536000 to respect origin Cache-Control headers
- **Reason**: CloudFront has its own TTL bounds that can override origin Cache-Control values; setting Min=0 allows origin headers to drive caching behavior
- **Bad Example**: CloudFront Minimum TTL=86400 overriding origin `max-age=3600`; content cached at edge for 24h instead of the intended 1h
- **Good Example**: Minimum TTL=0 respects origin `max-age=3600`; Default TTL=86400 for content without origin Cache-Control; Maximum TTL=31536000 as upper bound
- **Exceptions**: Override CloudFront TTLs intentionally when origin headers cannot be modified
- **Consequences Of Violation**: Unexpected cache duration—content may be cached longer than intended (stale) or shorter (unnecessary origin load)

## Rule 5: Set S3 Object Metadata with Proper Cache-Control
- **Category**: Maintainability
- **Rule**: Configure Cache-Control headers on S3 object metadata during upload
- **Reason**: S3 returns no Cache-Control by default; CloudFront uses its default TTL (24h) for objects without Cache-Control headers, regardless of desired caching behavior
- **Bad Example**: Uploading assets to S3 without setting Cache-Control metadata; CloudFront caches them for the default 24h instead of the optimal 1 year
- **Good Example**: Setting `Cache-Control: public, max-age=31536000, immutable` as S3 object metadata during upload
- **Exceptions**: Dynamic content served from S3 should have short or no Cache-Control
- **Consequences Of Violation**: Suboptimal cache duration; versioned assets needlessly revalidated every 24h
