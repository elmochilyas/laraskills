# Metadata

**Domain:** api-integration-engineering
**Subdomain:** api-versioning
**Knowledge Unit:** laravel-apiroute
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Controller namespaces per version
- [ ] Deprecation timeline documented
- [ ] Error responses versioned consistently
- [ ] Apply Deprecation Headers via Middleware
- [ ] Maintain Versions in Parallel During Migration
- [ ] Prefer URI Versioning as Default Strategy
- [ ] Return 410 Gone for Removed Versions
- [ ] Share Service Layer Between Versions
- [ ] All active versions tested
- [ ] Common logic shared via base controller/services
- [ ] Deprecated version route groups documented for removal
- [ ] Apply version-specific middleware per route group
- [ ] Create version-specific controllers: `Api\V1\UsersController`
- [ ] Define versioned route groups: `Route::prefix('v1')`, `Route::prefix('v2')`

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Apply version-specific middleware per route group
- [ ] Create version-specific controllers: `Api\V1\UsersController`
- [ ] Define versioned route groups: `Route::prefix('v1')`, `Route::prefix('v2')`
- [ ] Deprecate and remove old version route groups when sunset
- [ ] Keep version-specific transformers/validators in version directories
- [ ] Register routes for all active versions
- [ ] Share common logic via base controller or service classes
- [ ] Test all active version routes in CI
- [ ] Apply Deprecation Headers via Middleware
- [ ] Maintain Versions in Parallel During Migration
- [ ] Prefer URI Versioning as Default Strategy
- [ ] Return 410 Gone for Removed Versions

---

# Performance Checklist

- [ ] Header versioning: middleware adds ~0.5ms
- [ ] Multiple route files: slight increase in route registration time
- [ ] URI versioning: no overhead (different routes)
- [ ] Versioned DTOs: memory proportional to active versions

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Breaking changes within same version
- [ ] Forgetting to version error responses and pagination formats
- [ ] No deprecation timeline for old versions
- [ ] Versioning at parameter level (fragmented, hard to maintain)
- [ ] Versioning entire application instead of individual API

---

# Testing Checklist

- [ ] All active versions tested
- [ ] Common logic shared via base controller/services
- [ ] Controller namespaces per version
- [ ] Deprecated version route groups documented for removal
- [ ] Deprecation timeline documented
- [ ] Error responses versioned consistently
- [ ] Route files organized by version
- [ ] Route groups defined per version prefix
- [ ] Shared service layer between versions
- [ ] Versioning strategy chosen and documented

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [[Versioning at Parameter Level](#1-versioning-at-parameter-level)]
- [ ] [[No Deprecation Timeline for Old Versions](#2-no-deprecation-timeline-for-old-versions)]
- [ ] [[Breaking Changes Within Same Version](#3-breaking-changes-within-same-version)]
- [ ] [[Versioning the Entire Application](#4-versioning-the-entire-application)]
- [ ] [[Forgetting to Version Error Responses and Pagination](#5-forgetting-to-version-error-responses-and-pagination)]

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


