# Decomposition: Signed URLs

## Topic Overview
Signed URLs restrict access to private content delivered through CloudFront, ensuring only authorized users can download protected files. For Laravel applications, signed URLs protect paywalled content (PDFs, videos), membership-only downloads, and private user uploads. Without signed URLs, content is either public (insecure) or routed through the application server (slow, expensive).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-06-signed-urls/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Signed URLs
- **Purpose:** Signed URLs restrict access to private content delivered through CloudFront, ensuring only authorized users can download protected files. For Laravel applications, signed URLs protect paywalled content (PDFs, videos), membership-only downloads, and private user uploads. Without signed URLs, content is either public (insecure) or routed through the application server (slow, expensive).
- **Difficulty:** Foundation
- **Dependencies:** - CDN Integration (ku-01), - CloudFront Security, - S3 Access Control

## Dependency Graph
**Depends on:**
- CDN Integration (ku-01)
- CloudFront Security
- S3 Access Control

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Signed URLs: Per-file access control (download pages, paywalled content)
- Signed Cookies: Directory-level access (user galleries, membership vaults)
- CloudFront private content: When files must be stored in S3 but not publicly accessible
- Time-limited access: Free trial downloads, time-sensitive documents
**Out of scope:**
- Signed URLs: Not for public content (waste of signing computation); serve publicly
- CloudFront private content: Not needed if entire app is behind authentication (use ALB auth instead)
- URL signing for images on public pages: Public images don't need signed URLs
- Custom policies: Don't use custom policies when canned (just expiration) is sufficient (unnecessary complexity)
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