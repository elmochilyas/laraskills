# Signed URLs

## Metadata
- **ID**: KU-06-SIGNED-URLS
- **Subdomain**: cdn-storage-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Signed URLs
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Signed URLs restrict access to private content delivered through CloudFront, ensuring only authorized users can download protected files. For Laravel applications, signed URLs protect paywalled content (PDFs, videos), membership-only downloads, and private user uploads. Without signed URLs, content is either public (insecure) or routed through the application server (slow, expensive).

## Core Concepts
- **Signed URL**: Time-limited URL with cryptographic signature; URL invalid after expiration
- **Signed Cookie**: Cookie-based authorization for multiple files (session-like for a directory)
- **CloudFront key pair**: Trusted key group for signing; private key on app server, public key uploaded to CloudFront
- **Policy statement**: JSON defining URL, expiration, optional IP/date range restrictions
- **Canned vs custom policy**: Canned = simple (just expiration); Custom = advanced (IP range, start date, multiple restrictions)

## When To Use
- Signed URLs: Per-file access control (download pages, paywalled content)
- Signed Cookies: Directory-level access (user galleries, membership vaults)
- CloudFront private content: When files must be stored in S3 but not publicly accessible
- Time-limited access: Free trial downloads, time-sensitive documents

## When NOT To Use
- Signed URLs: Not for public content (waste of signing computation); serve publicly
- CloudFront private content: Not needed if entire app is behind authentication (use ALB auth instead)
- URL signing for images on public pages: Public images don't need signed URLs
- Custom policies: Don't use custom policies when canned (just expiration) is sufficient (unnecessary complexity)

## Best Practices
- **Use CloudFront origin access control (OAC) + signed URLs**: S3 is fully private; only CloudFront can access it; end users get time-limited signed URLs (WHY: defense in depth; even if someone discovers the S3 bucket URL, they cannot download files without CloudFront)
- **Short expiration for APIs**: Signed URLs for API-triggered downloads expire in 1-5 minutes (WHY: prevents URL sharing; users must authenticate through the app for new URLs)
- **Cache signed URLs at CloudFront**: Signed URLs are cache keys; same URL content is cached at edge (WHY: multiple requests with same signed URL hit edge cache; limits origin requests)
- **Use signed cookies for multiple files**: When a user needs access to many files (gallery, dashboard attachments), use Signed Cookie instead of multiple Signed URLs (WHY: one cookie covers all files in the path; reduces signing overhead and URL length issues)

## Architecture Guidelines
- Generate signed URLs in Laravel service class using `aws/aws-sdk-php` CloudFront client
- Store CloudFront private key securely (Secrets Manager or parameter store, not in repo)
- Implement URL signing as a middleware or service that wraps file download routes
- Log signed URL generation for auditing (but don't log the private key)
- Use key groups for CloudFront signing (rotate keys without downtime)

## Performance Considerations
- URL signing with RSA-SHA1 takes 1-5ms per URL on modern hardware (negligible)
- Signed URLs are slightly longer (~300 chars vs ~100 chars); negligible HTTP overhead
- Pre-signed S3 URLs vs CloudFront signed URLs: CloudFront is faster (edge caching) and cheaper (no S3 request charges for cached content)
- Signed Cookies add ~1KB per response (cookie header); negligible

## Security Considerations
- Never store CloudFront private key in repository; use environment variables or Secrets Manager
- Rotate CloudFront key pairs every 90 days
- Set shortest possible expiration for the use case (minutes for downloads, hours for galleries)
- Signed URLs are logged in CloudFront logs if enabled; ensure sensitive file access is logged
- IP range restriction adds security but breaks mobile users with changing IPs

## Common Mistakes
1. **Serving private content through PHP instead of CloudFront Signed URLs**: Reading file from S3 in Laravel controller and streaming to user (Cause: simpler authentication logic; Consequence: file goes through PHP -> ALB -> CloudFront -> user; 2x data transfer cost, 10-100ms latency, PHP memory for buffering; Better: generate CloudFront signed URL, redirect user to CloudFront)
2. **Overly long expiration**: Setting signed URL expiration to 24 hours for download links (Cause: convenience for user; Consequence: URL can be shared widely; Better: 1-5 minute expiration; user must visit site to get new URL)
3. **Storing private key in repository**: Committing .pem file to Git (Cause: convenience during development; Consequence: private key compromised if repo is breached; Better: store in environment variables or Secrets Manager, never in repo)

## Anti-Patterns
- **Signed URLs for public content**: Public images don't need signing; use public CloudFront URL
- **PHP-proxied file downloads**: File served through Laravel controller instead of CloudFront redirect
- **Same signed URL for all users**: No user tracking; any user with URL can access content

## Examples
- **PDF download**: Authenticated user clicks "Download Report" -> Laravel generates CloudFront signed URL (5min expiry) -> redirects user to CloudFront -> CloudFront validates signature -> serves PDF from S3
- **Attachment gallery**: User opens gallery -> PHP sets Signed Cookie for /private/user/{id}/ -> all image tags in gallery load from CloudFront without individual signing
- **Video streaming**: CloudFront signed URLs with custom policy for video segments; prevents hotlinking

## Related Topics
- CDN Integration (ku-01)
- CloudFront Security
- S3 Access Control

## AI Agent Notes
- Default: use CloudFront signed URLs (not S3 pre-signed) for private content
- Recommend Laravel service class for URL generation
- Warn against serving files through PHP controllers

## Verification
- [ ] Private content uses CloudFront signed URLs/Signed Cookies
- [ ] CloudFront private key stored securely (Secrets Manager, not repo)
- [ ] Short expiration times configured (minutes for downloads)
- [ ] OAC enabled (S3 fully private)
- [ ] No PHP-proxied file downloads for public/static content
