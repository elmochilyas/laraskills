# Decomposition: Image Optimization

## Topic Overview
Image optimization reduces storage costs (S3), data transfer costs (CloudFront), and improves page load times. Unoptimized images account for 60-70% of page weight. For Laravel applications, images include user uploads (avatars, galleries) and static assets (logos, backgrounds). Systematically converting to modern formats (WebP/AVIF), resizing to display dimensions, and compressing with quality tuning reduces transfer volume by 50-80%.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-05-image-optimization/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Image Optimization
- **Purpose:** Image optimization reduces storage costs (S3), data transfer costs (CloudFront), and improves page load times. Unoptimized images account for 60-70% of page weight. For Laravel applications, images include user uploads (avatars, galleries) and static assets (logos, backgrounds). Systematically converting to modern formats (WebP/AVIF), resizing to display dimensions, and compressing with quality tuning reduces transfer volume by 50-80%.
- **Difficulty:** Foundation
- **Dependencies:** - File Compression (ku-04), - CDN Integration (ku-01), - Storage Tier Selection (ku-07)

## Dependency Graph
**Depends on:**
- File Compression (ku-04)
- CDN Integration (ku-01)
- Storage Tier Selection (ku-07)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- WebP conversion: All raster images served to browsers (JPEG, PNG, GIF)
- AVIF: When supporting modern browsers and maximum compression is desired
- Responsive images: Any site with images viewed on mobile + desktop
- Lazy loading: Pages with 5+ images below the fold
- Image CDN: High-traffic apps with dynamic image transformations
**Out of scope:**
- WebP: Not for archival originals (keep original JPEG/PNG as source); convert only delivered versions
- Responsive images: Not needed for single-size thumbnails (always same display size)
- Image CDN: Not needed for apps with <10 uploads/day; batch process locally instead
- AVIF: If browser support is required for <5% of users (IE11, older Safari)
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