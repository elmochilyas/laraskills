# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 05-cdn-storage-optimization
**Knowledge Unit:** Image Optimization
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Uploaded images auto-converted to WebP
- [ ] Multiple sizes generated on upload (thumbnail, medium, large)
- [ ] `<picture>` element with WebP + fallback in Blade templates
- [ ] Lazy loading on below-fold images
- [ ] EXIF data stripped from served images
- [ ] Convert to WebP at upload time applied
- [ ] Generate multiple sizes on upload applied
- [ ] Lazy load below-fold images applied
- [ ] Client-side resize prevented
- [ ] JPEG for everything prevented
- [ ] Serving full-resolution originals prevented
- [ ] No format optimization prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Store original images in S3 (one master copy); generate optimized variants during upload
- [ ] Architecture guideline: Implement a responsive image component in Blade that emits `<picture>` element with WebP + JPEG sources
- [ ] Architecture guideline: Use Spatie MediaLibrary for Laravel
- [ ] Architecture guideline: For dynamic transforms on user-generated content, consider a dedicated image service
- [ ] Architecture guideline: Set S3 lifecycle policy to move originals to Glacier after 90 days (keep only WebP variants in standard storage)

---

# Implementation Checklist

- [ ] Best practice applied: Convert to WebP at upload time
- [ ] Best practice applied: Generate multiple sizes on upload
- [ ] Best practice applied: Lazy load below-fold images
- [ ] Best practice applied: Use CloudFront with image transformations
- [ ] Workflow step completed: Inventory current Image Optimization resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] WebP conversion is CPU-intensive; do at upload time (background job), not at request time
- [ ] CloudFront + Lambda@Edge image transform adds 50-200ms for first request (then cached)
- [ ] Responsive images reduce page weight by 50-80% without sacrificing visual quality
- [ ] AVIF encoding is 10x slower than WebP; use for served images only, with on-the-fly conversion
- [ ] Lazy loading increases initial page load speed by 30-50% on image-heavy pages

---

# Security Checklist

- [ ] Validate uploaded images (type, dimensions, content) to prevent malicious file uploads
- [ ] Use Image Intervention's auto-orientation carefully (EXIF data can contain large thumbnails)
- [ ] Strip EXIF data from served images (privacy
- [ ] Serve images from separate subdomain (img.example.com) to prevent cookie leakage

---

# Reliability Checklist

- [ ] Mistake prevented: Serving full-resolution originals
- [ ] Mistake prevented: No format optimization
- [ ] Mistake prevented: Front-end only optimization

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Uploaded images auto-converted to WebP
- [ ] Multiple sizes generated on upload (thumbnail, medium, large)
- [ ] `<picture>` element with WebP + fallback in Blade templates
- [ ] Lazy loading on below-fold images
- [ ] EXIF data stripped from served images
- [ ] Original images moved to Glacier after 90 days

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Image Optimization configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Client-side resize
- [ ] Anti-pattern prevented: JPEG for everything
- [ ] Anti-pattern prevented: No alt text for optimized images
- [ ] Common mistake prevented: Serving full-resolution originals
- [ ] Common mistake prevented: No format optimization
- [ ] Common mistake prevented: Front-end only optimization

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Uploaded images auto-converted to WebP
- [ ] Verification passed: Multiple sizes generated on upload (thumbnail, medium, large)
- [ ] Verification passed: `<picture>` element with WebP + fallback in Blade templates

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
