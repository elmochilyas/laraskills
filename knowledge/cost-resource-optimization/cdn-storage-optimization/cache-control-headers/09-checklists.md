# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 05-cdn-storage-optimization
**Knowledge Unit:** Cache Control Headers
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Hashed static assets have `max-age=31536000, immutable`
- [ ] API routes return ETag headers
- [ ] No `Cache-Control: no-store` on cacheable public endpoints
- [ ] S3 object metadata configured with proper Cache-Control
- [ ] CloudFront TTL bounds set correctly (Min=0, Default=86400, Max=31536000)
- [ ] Version static assets with content hash applied
- [ ] Use ETag for dynamic content applied
- [ ] Set short TTL with revalidation for HTML applied
- [ ] `no-cache` without validation prevented
- [ ] Same Cache-Control for all routes prevented
- [ ] No Cache-Control on static assets prevented
- [ ] `private` directive preventing CloudFront caching prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Configure Laravel Mix/Vite to output content-hashed filenames automatically
- [ ] Architecture guideline: Add ETag middleware for API routes (Laravel ETag middleware package or custom)
- [ ] Architecture guideline: Set Cache-Control headers in Nginx/Apache for file-based assets
- [ ] Architecture guideline: For Laravel responses, use `$response->setCache()` or middleware per-route
- [ ] Architecture guideline: Never override Cache-Control at CloudFront for hashed assets; respect origin headers

---

# Implementation Checklist

- [ ] Best practice applied: Version static assets with content hash
- [ ] Best practice applied: Use ETag for dynamic content
- [ ] Best practice applied: Set short TTL with revalidation for HTML
- [ ] Best practice applied: Override CloudFront TTLs at distribution level
- [ ] Workflow step completed: Inventory current Cache Control Headers resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] `immutable` directive prevents browser revalidation entirely (fastest possible)
- [ ] ETag revalidation sends 304 responses (~500 bytes) vs full 200 responses (50KB-1MB)
- [ ] Cache hit ratio target
- [ ] Conditional requests cost virtually nothing (Lambda@Edge or ALB processing still applies)

---

# Security Checklist

- [ ] Never cache authenticated responses with user-specific data (use `private` or `no-store`)
- [ ] `immutable` directive should never be used on non-versioned URLs (cache poisoning risk)
- [ ] ETags should be content-derived (cryptographic hash), not based on timestamps (prevents timing attacks)
- [ ] Clear cache with version change, not header change; changing Cache-Control on existing URL may not invalidate

---

# Reliability Checklist

- [ ] Mistake prevented: No Cache-Control on static assets
- [ ] Mistake prevented: `private` directive preventing CloudFront caching
- [ ] Mistake prevented: Overriding headers in CloudFront

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Hashed static assets have `max-age=31536000, immutable`
- [ ] API routes return ETag headers
- [ ] No `Cache-Control: no-store` on cacheable public endpoints
- [ ] S3 object metadata configured with proper Cache-Control
- [ ] CloudFront TTL bounds set correctly (Min=0, Default=86400, Max=31536000)

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Cache Control Headers configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: `no-cache` without validation
- [ ] Anti-pattern prevented: Same Cache-Control for all routes
- [ ] Anti-pattern prevented: Immutable on non-hashed URLs
- [ ] Common mistake prevented: No Cache-Control on static assets
- [ ] Common mistake prevented: `private` directive preventing CloudFront caching
- [ ] Common mistake prevented: Overriding headers in CloudFront

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Hashed static assets have `max-age=31536000, immutable`
- [ ] Verification passed: API routes return ETag headers
- [ ] Verification passed: No `Cache-Control: no-store` on cacheable public endpoints

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
