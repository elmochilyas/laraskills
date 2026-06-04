# Decomposition: File Compression

## Topic Overview
Compression reduces data transfer volume, lowering CDN and network costs while improving load times. CloudFront supports automatic compression (gzip/brotli) for text-based responses. For Laravel, enabling compression on HTML, CSS, JS, and JSON reduces data transfer by 60-80%. Pre-compressed assets in S3 further reduce origin CPU usage.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-04-file-compression/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### File Compression
- **Purpose:** Compression reduces data transfer volume, lowering CDN and network costs while improving load times. CloudFront supports automatic compression (gzip/brotli) for text-based responses. For Laravel, enabling compression on HTML, CSS, JS, and JSON reduces data transfer by 60-80%. Pre-compressed assets in S3 further reduce origin CPU usage.
- **Difficulty:** Foundation
- **Dependencies:** - CDN Integration (ku-01), - Cache Control Headers (ku-03), - Image Optimization (ku-05)

## Dependency Graph
**Depends on:**
- CDN Integration (ku-01)
- Cache Control Headers (ku-03)
- Image Optimization (ku-05)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- CloudFront compression: Always for text-based responses (HTML, CSS, JS, JSON, XML, SVG, fonts)
- Pre-compression: For high-traffic S3 origins when you want to minimize CloudFront compute cost
- Image compression: Use WebP/AVIF at the edge (via Lambda@Edge or S3 transform)
- Brotli: When clients support it (all modern browsers); use both gzip as fallback
**Out of scope:**
- CloudFront compression: Do not enable for already-compressed binary files (images, video, archives) - wastes CPU with no benefit
- Pre-compression: Not needed for low-traffic apps (<10K requests/day); CloudFront on-the-fly compression is sufficient and free
- Compression for API responses: JSON is text and should be compressed; but if API response time is critical, compression adds 1-5ms CPU overhead on small payloads
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