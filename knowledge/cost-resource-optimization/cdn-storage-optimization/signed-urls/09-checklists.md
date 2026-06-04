# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 05-cdn-storage-optimization
**Knowledge Unit:** Signed URLs
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Private content uses CloudFront signed URLs/Signed Cookies
- [ ] CloudFront private key stored securely (Secrets Manager, not repo)
- [ ] Short expiration times configured (minutes for downloads)
- [ ] OAC enabled (S3 fully private)
- [ ] No PHP-proxied file downloads for public/static content
- [ ] Use CloudFront origin access control (OAC) + signed URLs applied
- [ ] Short expiration for APIs applied
- [ ] Cache signed URLs at CloudFront applied
- [ ] Signed URLs for public content prevented
- [ ] PHP-proxied file downloads prevented
- [ ] Serving private content through PHP instead of CloudFront Signed URLs prevented
- [ ] Overly long expiration prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Generate signed URLs in Laravel service class using `aws/aws-sdk-php` CloudFront client
- [ ] Architecture guideline: Store CloudFront private key securely (Secrets Manager or parameter store, not in repo)
- [ ] Architecture guideline: Implement URL signing as a middleware or service that wraps file download routes
- [ ] Architecture guideline: Log signed URL generation for auditing (but don't log the private key)
- [ ] Architecture guideline: Use key groups for CloudFront signing (rotate keys without downtime)

---

# Implementation Checklist

- [ ] Best practice applied: Use CloudFront origin access control (OAC) + signed URLs
- [ ] Best practice applied: Short expiration for APIs
- [ ] Best practice applied: Cache signed URLs at CloudFront
- [ ] Best practice applied: Use signed cookies for multiple files
- [ ] Workflow step completed: Inventory current Signed Urls resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] URL signing with RSA-SHA1 takes 1-5ms per URL on modern hardware (negligible)
- [ ] Signed URLs are slightly longer (~300 chars vs ~100 chars); negligible HTTP overhead
- [ ] Pre-signed S3 URLs vs CloudFront signed URLs
- [ ] Signed Cookies add ~1KB per response (cookie header); negligible

---

# Security Checklist

- [ ] Never store CloudFront private key in repository; use environment variables or Secrets Manager
- [ ] Rotate CloudFront key pairs every 90 days
- [ ] Set shortest possible expiration for the use case (minutes for downloads, hours for galleries)
- [ ] Signed URLs are logged in CloudFront logs if enabled; ensure sensitive file access is logged
- [ ] IP range restriction adds security but breaks mobile users with changing IPs

---

# Reliability Checklist

- [ ] Mistake prevented: Serving private content through PHP instead of CloudFront Signed URLs
- [ ] Mistake prevented: Overly long expiration
- [ ] Mistake prevented: Storing private key in repository

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Private content uses CloudFront signed URLs/Signed Cookies
- [ ] CloudFront private key stored securely (Secrets Manager, not repo)
- [ ] Short expiration times configured (minutes for downloads)
- [ ] OAC enabled (S3 fully private)
- [ ] No PHP-proxied file downloads for public/static content

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Signed Urls configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Signed URLs for public content
- [ ] Anti-pattern prevented: PHP-proxied file downloads
- [ ] Anti-pattern prevented: Same signed URL for all users
- [ ] Common mistake prevented: Serving private content through PHP instead of CloudFront Signed URLs
- [ ] Common mistake prevented: Overly long expiration
- [ ] Common mistake prevented: Storing private key in repository

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Private content uses CloudFront signed URLs/Signed Cookies
- [ ] Verification passed: CloudFront private key stored securely (Secrets Manager, not repo)
- [ ] Verification passed: Short expiration times configured (minutes for downloads)

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
