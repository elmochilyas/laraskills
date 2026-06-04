# KU-05-IMAGE-OPTIMIZATION: Image Optimization

## Metadata
- **ID**: KU-05-IMAGE-OPTIMIZATION
- **Subdomain**: CDN & Storage Optimization
- **Topic**: Image Optimization
- **Source**: CDN & Storage Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Image optimization reduces storage costs (S3), data transfer costs (CloudFront), and improves page load times. Unoptimized images account for 60-70% of page weight. For Laravel applications, images include user uploads (avatars, galleries) and static assets (logos, backgrounds). Systematically converting to modern formats (WebP/AVIF), resizing to display dimensions, and compressing with quality tuning reduces transfer volume by 50-80%.

## Core Concepts
- **WebP**: Modern image format with 25-35% better compression than JPEG; supported by 97% of browsers
- **AVIF**: Next-gen format with 50% better compression than JPEG; growing browser support (~90%)
- **Responsive images**: Serving different sizes based on viewport (srcset attribute)
- **Lazy loading**: Deferring image load until near viewport (loading="lazy" attribute)
- **Image CDN**: Specialized services (CloudFront + Lambda@Edge or imgix/Cloudinary) for on-the-fly transforms
- **S3 object storage costs**: $0.023/GB/month; each MB of unoptimized images costs over time

## Mental Models
- Default recommendation: WebP conversion at upload with responsive srcset
- For Laravel projects, recommend Spatie MediaLibrary for image management
- Reject client-side resize solutions; always prefer server-side processing

## Internal Mechanics
- WebP conversion is CPU-intensive; do at upload time (background job), not at request time
- CloudFront + Lambda@Edge image transform adds 50-200ms for first request (then cached)
- Responsive images reduce page weight by 50-80% without sacrificing visual quality
- AVIF encoding is 10x slower than WebP; use for served images only, with on-the-fly conversion
- Lazy loading increases initial page load speed by 30-50% on image-heavy pages

## Patterns
- Convert to WebP at upload time
- Generate multiple sizes on upload
- Lazy load below-fold images
- Use CloudFront with image transformations

## Architectural Decisions
- Store original images in S3 (one master copy); generate optimized variants during upload
- Implement a responsive image component in Blade that emits `<picture>` element with WebP + JPEG sources
- Use Spatie MediaLibrary for Laravel: built-in image conversions, responsive images
- For dynamic transforms on user-generated content, consider a dedicated image service
- Set S3 lifecycle policy to move originals to Glacier after 90 days (keep only WebP variants in standard storage)

## Tradeoffs
**When To Use:**
- WebP conversion: All raster images served to browsers (JPEG, PNG, GIF)
- AVIF: When supporting modern browsers and maximum compression is desired
- Responsive images: Any site with images viewed on mobile + desktop
- Lazy loading: Pages with 5+ images below the fold
- Image CDN: High-traffic apps with dynamic image transformations

**When NOT To Use:**
- WebP: Not for archival originals (keep original JPEG/PNG as source); convert only delivered versions
- Responsive images: Not needed for single-size thumbnails (always same display size)
- Image CDN: Not needed for apps with <10 uploads/day; batch process locally instead
- AVIF: If browser support is required for <5% of users (IE11, older Safari)

## Performance Considerations
- WebP conversion is CPU-intensive; do at upload time (background job), not at request time
- CloudFront + Lambda@Edge image transform adds 50-200ms for first request (then cached)
- Responsive images reduce page weight by 50-80% without sacrificing visual quality
- AVIF encoding is 10x slower than WebP; use for served images only, with on-the-fly conversion
- Lazy loading increases initial page load speed by 30-50% on image-heavy pages

## Production Considerations
- Validate uploaded images (type, dimensions, content) to prevent malicious file uploads
- Use Image Intervention's auto-orientation carefully (EXIF data can contain large thumbnails)
- Strip EXIF data from served images (privacy: GPS location, camera info)
- Serve images from separate subdomain (img.example.com) to prevent cookie leakage

## Common Mistakes
- **Serving full-resolution originals**: Displaying 4000x3000px 5MB image in a 150x150px thumbnail (Cause: no image processing pipeline; Consequence: 50x unnecessary data transfer; Better: generate thumbnail on upload)
- **No format optimization**: Serving JPEG/PNG when browser supports WebP (Cause: unaware of WebP or lazy to implement; Consequence: 25-35% higher data transfer cost; Better: implement `<picture>` element with WebP source)
- **Front-end only optimization**: Using JS library to resize after load (Cause: thinking optimization is front-end concern; Consequence: full-size image still transferred before JS resizing; Better: server-side resize + responsive images)

## Failure Modes
- **Client-side resize**: Loading full image then scaling with CSS/JS; full image bytes still transferred
- **JPEG for everything**: Using JPEG for screenshots, diagrams, logos (PNG/WebP works better for text)
- **No alt text for optimized images**: Accessible images require descriptive alt text regardless of format

## Ecosystem Usage
- **Upload pipeline**: User uploads photo -> Spatie MediaLibrary converts to WebP (thumb 150p, medium 600px, large 1200px) -> S3
- **Blade component**: `<picture><source srcset="{{ $image->webp }}" type="image/webp"><img src="{{ $image->jpg }}" loading="lazy"></picture>`
- **CDN transformation**: CloudFront Function checks Accept: image/webp header -> requests WebP version from S3 or falls back to JPEG

## Related Knowledge Units
- File Compression (ku-04)
- CDN Integration (ku-01)
- Storage Tier Selection (ku-07)

## Research Notes
Derived from CDN & Storage Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.