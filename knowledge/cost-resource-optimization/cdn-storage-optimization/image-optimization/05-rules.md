# Image Optimization Rules

## Rule 1: Convert to WebP at Upload Time
- **Category**: Performance
- **Rule**: Automatically convert all uploaded raster images (JPEG, PNG, GIF) to WebP format during the upload process
- **Reason**: WebP is 25-35% smaller than JPEG with equivalent quality; every upload stored as WebP saves storage cost and transfer cost across the entire lifecycle; storing both original and WebP allows regeneration of variants
- **Bad Example**: Storing and serving original JPEG uploads (5MB each) when WebP versions (3MB) would provide identical visual quality
- **Good Example**: Using Intervention Image or Spatie MediaLibrary to auto-convert uploads to WebP during the upload job
- **Exceptions**: Archival originals should remain in original format; convert only delivered versions
- **Consequences Of Violation**: 25-35% higher storage and data transfer costs for image content

## Rule 2: Generate Multiple Sizes on Upload
- **Category**: Performance
- **Rule**: Create thumbnail (150px), medium (600px), and large (1200px) variants for every uploaded image
- **Reason**: Serving a 4000px original image in a 300px thumbnail slot wastes 95% of transferred bytes; multiple sizes enable responsive image delivery with the appropriate resolution for each viewport
- **Bad Example**: Serving a 4000px user photo (5MB) as a 150x150 thumbnail; 95% of data is wasted
- **Good Example**: Upload pipeline generates 150px (10KB), 600px (80KB), 1200px (250KB) WebP variants; Blade template uses `<picture>` with srcset
- **Exceptions**: Single-size display images that always render at the same dimensions
- **Consequences Of Violation**: 10-20x higher data transfer for image content than necessary; slower page loads

## Rule 3: Lazy Load Below-Fold Images
- **Category**: Performance
- **Rule**: Add `loading="lazy"` to all non-critical images that are not in the initial viewport
- **Reason**: Lazy loading reduces initial page weight by 40-60%; images only load when the user scrolls near them, saving bandwidth and improving Largest Contentful Paint (LCP)
- **Bad Example**: A product listing page with 50 product images all loading on page load, even though only the first 6 are visible
- **Good Example**: Adding `loading="lazy"` to images 7-50; they load only as the user scrolls
- **Exceptions**: Above-fold images (LCP candidates) should not have lazy loading
- **Consequences Of Violation**: Unnecessary initial data transfer; slower page load times; higher bounce rates

## Rule 4: Strip EXIF Data from Served Images
- **Category**: Security
- **Rule**: Remove EXIF metadata from all images served to users; retain originals with EXIF for archival
- **Reason**: EXIF data may contain GPS location, camera serial numbers, and timestamps that compromise user privacy or leak internal information
- **Bad Example**: Serving user-uploaded photos with embedded GPS coordinates visible to all viewers
- **Good Example**: Stripping EXIF data during the image processing pipeline; served images contain only pixel data
- **Exceptions**: Photography portfolios where EXIF data (camera, lens, settings) is intentionally displayed
- **Consequences Of Violation**: Privacy violations from exposed GPS location data; potential security risks from leaked metadata

## Rule 5: Use CloudFront for Image Transformation
- **Category**: Architecture
- **Rule**: Use Lambda@Edge or CloudFront Functions for on-the-fly image format conversion based on browser Accept header
- **Reason**: Serves the optimal image format without requiring browser-specific URLs; modern browsers get WebP/AVIF, legacy browsers get JPEG/PNG; transformation results are cached at edge
- **Bad Example**: Serving only JPEG images regardless of browser support; WebP-capable browsers waste bandwidth
- **Good Example**: CloudFront Function checks `Accept: image/webp` header and serves WebP version; falls back to JPEG for unsupported browsers
- **Exceptions**: Apps using Spatie MediaLibrary with pre-generated variants may not need on-the-fly transformation
- **Consequences Of Violation**: WebP-capable browsers served larger JPEG files; 25-35% higher transfer for modern browsers
