# Metadata

**Domain:** api-integration-engineering
**Subdomain:** api-versioning
**Knowledge Unit:** api-versioning-strategies
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All active versions are explicitly listed in version registry
- [ ] CI tests run against all supported versions
- [ ] Deprecated versions return Deprecation and Sunset headers
- [ ] Prefer URI Path Versioning as Default
- [ ] Share Domain Services Between Versions
- [ ] Support Minimum 6-Month Migration Window
- [ ] Use Parallel Version Deployment
- [ ] Use Versioned Namespaces and Route Files
- [ ] All active versions tested in CI/CD
- [ ] Applied consistently across all API endpoints
- [ ] Multiple active versions supported
- [ ] Choose one strategy and apply consistently across all endpoints
- [ ] Communicate version lifecycle to consumers
- [ ] Document versioning strategy in API docs

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Choose one strategy and apply consistently across all endpoints
- [ ] Communicate version lifecycle to consumers
- [ ] Document versioning strategy in API docs
- [ ] Evaluate strategies:
- [ ] Implement routing: separate route groups per version
- [ ] Support multiple active versions simultaneously
- [ ] Test all active versions in CI/CD pipeline
- [ ] Prefer URI Path Versioning as Default
- [ ] Share Domain Services Between Versions
- [ ] Support Minimum 6-Month Migration Window
- [ ] Use Parallel Version Deployment
- [ ] Use Versioned Namespaces and Route Files

---

# Performance Checklist

- [ ] Header versioning: middleware parsing adds ~1ms per request
- [ ] Multiple versions double route table entries but with negligible performance impact
- [ ] Route caching (`php artisan route:cache`) mitigates version route registration cost
- [ ] URI versioning: no overhead beyond route matching (fastest)
- [ ] Version analytics logging adds per-request overhead; use sampling for production

---

# Security Checklist

- [ ] Deprecated versions should still receive security updates during the migration window
- [ ] Old versions may have known vulnerabilities; ensure security patches are backported to all active versions
- [ ] Removed versions should return 410 Gone with migration instructions, never 404 (which suggests the resource doesn't exist)
- [ ] Version analytics should not expose consumer-identifying information beyond what's necessary

---

# Reliability Checklist

- [ ] Reliability measures implemented

---

# Testing Checklist

- [ ] All active versions are explicitly listed in version registry
- [ ] All active versions tested in CI/CD
- [ ] Applied consistently across all API endpoints
- [ ] CI tests run against all supported versions
- [ ] Deprecated versions return Deprecation and Sunset headers
- [ ] Multiple active versions supported
- [ ] Removed versions return 410 Gone, not 404
- [ ] Route cache works with all versioned routes
- [ ] Version lifecycle documented for consumers
- [ ] Versioning strategy chosen and documented

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [[Versionless Drift](#1-versionless-drift)]
- [ ] [[Cosmetic Versioning](#2-cosmetic-versioning)]
- [ ] [[Eternal Version Support](#3-eternal-version-support)]
- [ ] [[Database Schema Versioning](#4-database-schema-versioning)]
- [ ] Cosmetic versioning
- [ ] Database schema versioning
- [ ] Eternal version support
- [ ] Versionless drift

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


