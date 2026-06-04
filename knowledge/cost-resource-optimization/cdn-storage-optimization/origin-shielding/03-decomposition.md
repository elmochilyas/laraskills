# Decomposition: Origin Shielding

## Topic Overview
CloudFront Origin Shield is an additional caching layer in a single AWS region that sits between CloudFront edge locations and your origin. Without Origin Shield, each edge location sends its own request to the origin on a cache miss. Origin Shield centralizes these into a single origin request, reducing origin load by up to 80% for global applications.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-02-origin-shielding/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Origin Shielding
- **Purpose:** CloudFront Origin Shield is an additional caching layer in a single AWS region that sits between CloudFront edge locations and your origin. Without Origin Shield, each edge location sends its own request to the origin on a cache miss. Origin Shield centralizes these into a single origin request, reducing origin load by up to 80% for global applications.
- **Difficulty:** Foundation
- **Dependencies:** - CDN Integration (ku-01), - Cache Control Headers (ku-03), - File Compression (ku-04)

## Dependency Graph
**Depends on:**
- CDN Integration (ku-01)
- Cache Control Headers (ku-03)
- File Compression (ku-04)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Global audience: Apps with users in multiple continents (multiple edge locations requesting same objects)
- Expensive origin compute: When each origin request requires significant CPU/database work
- High request volume: >100 requests/second to same objects (e.g., popular images, PDFs)
- S3 origin: Less critical (S3 scales easily), but still reduces S3 request costs
**Out of scope:**
- Single-region users: If all users are in one AWS region close to origin, minimal benefit
- Low-traffic apps: <10 requests/second; shield adds small latency with negligible origin reduction
- Dynamic-only content: If no cacheable content is served (100% uncacheable HTML/API)
- Minimal cost: Origin Shield costs $0.01/GB of edge data; very cheap but adds to bill
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