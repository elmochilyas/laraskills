# Decomposition: CDN Integration

## Topic Overview
CDN integration (CloudFront in front of S3 or EC2/ALB) reduces origin load by caching static and dynamic content at edge locations. For Laravel, CloudFront caches CSS/JS/images while passing through uncacheable HTML. Proper integration reduces S3/EC2 data transfer costs by 60-90% and improves page load times globally.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-01-cdn-integration/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### CDN Integration
- **Purpose:** CDN integration (CloudFront in front of S3 or EC2/ALB) reduces origin load by caching static and dynamic content at edge locations. For Laravel, CloudFront caches CSS/JS/images while passing through uncacheable HTML. Proper integration reduces S3/EC2 data transfer costs by 60-90% and improves page load times globally.
- **Difficulty:** Foundation
- **Dependencies:** - Origin Shielding (ku-02), - Cache Control Headers (ku-03), - File Compression (ku-04), - Image Optimization (ku-05)

## Dependency Graph
**Depends on:**
- Origin Shielding (ku-02)
- Cache Control Headers (ku-03)
- File Compression (ku-04)
- Image Optimization (ku-05)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- CloudFront: Always in production for serving static assets and reducing origin load
- CloudFront + S3: For all static file delivery (CSS, JS, images, downloads)
- CloudFront + ALB: For dynamic content when you need edge caching of API responses
- Free tier coverage: Apps under 1TB/month transfer and 10M requests/month
**Out of scope:**
- CloudFront: Not needed for purely backend API services with no public static assets
- CloudFront with dynamic-only apps: If 100% of traffic is uncacheable HTML, CloudFront adds latency (SSL negotiation) with no caching benefit
- Direct S3 serving: Only acceptable for admin-only asset delivery (no public traffic)
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization