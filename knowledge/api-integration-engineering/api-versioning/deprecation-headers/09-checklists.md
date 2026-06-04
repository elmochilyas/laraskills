# Metadata

**Domain:** api-integration-engineering
**Subdomain:** api-versioning
**Knowledge Unit:** deprecation-headers
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All deprecated versions return Deprecation: true header
- [ ] All sunset versions return Sunset header with valid HTTP-date
- [ ] Artisan commands for lifecycle transitions work correctly
- [ ] Add Deprecation Header Immediately on Deprecation Decision
- [ ] Include Link Header with Successor Version URL
- [ ] Return 410 Gone for Removed Versions
- [ ] Sample Version Analytics for Performance
- [ ] Set Realistic Sunset Dates Based on Usage Analytics
- [ ] `Deprecation: true` header on deprecated endpoints
- [ ] `Link` header with migration guide URL
- [ ] `Sunset` header with ISO datetime
- [ ] Add `Deprecation: true` header to deprecated endpoints
- [ ] Add `Sunset: {datetime}` header with expected removal date
- [ ] Add `X-API-Warning` with human-readable message

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add `Deprecation: true` header to deprecated endpoints
- [ ] Add `Sunset: {datetime}` header with expected removal date
- [ ] Add `X-API-Warning` with human-readable message
- [ ] Include `Sunset` link header to migration guide
- [ ] Log deprecation header delivery for consumer tracking
- [ ] Monitor deprecated endpoint usage over time
- [ ] Remove endpoints only after sunset date and zero usage
- [ ] Return deprecation headers for all requests to deprecated endpoints
- [ ] Add Deprecation Header Immediately on Deprecation Decision
- [ ] Include Link Header with Successor Version URL
- [ ] Return 410 Gone for Removed Versions
- [ ] Sample Version Analytics for Performance

---

# Performance Checklist

- [ ] Analytics logging adds configurable overhead; use sampling for high-traffic endpoints
- [ ] Header injection adds negligible overhead (~0.1ms per request)
- [ ] Route group middleware applies to all deprecated endpoints with no per-endpoint cost
- [ ] Sunset date parsing is a one-time operation at middleware registration

---

# Security Checklist

- [ ] Analytics on deprecated versions should not expose individual consumer identity
- [ ] Deprecation headers should not reveal internal versioning strategy or future plans beyond what's intended
- [ ] Removed versions returning 410 Gone with migration info should not leak information about the new version's security posture

---

# Reliability Checklist

- [ ] Reliability measures implemented

---

# Testing Checklist

- [ ] `Deprecation: true` header on deprecated endpoints
- [ ] `Link` header with migration guide URL
- [ ] `Sunset` header with ISO datetime
- [ ] `X-API-Warning` with human-readable message
- [ ] All deprecated versions return Deprecation: true header
- [ ] All sunset versions return Sunset header with valid HTTP-date
- [ ] Artisan commands for lifecycle transitions work correctly
- [ ] Deprecated endpoint usage monitored
- [ ] Deprecation headers logged for tracking
- [ ] Endpoints removed only after sunset + zero usage

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [[Silent Deprecation](#1-silent-deprecation)]
- [ ] [[Evergreen Deprecation](#2-evergreen-deprecation)]
- [ ] [[Reactive Version Removal](#3-reactive-version-removal)]
- [ ] [[Header-Only Communication](#4-header-only-communication)]
- [ ] Evergreen deprecation
- [ ] Header-only communication
- [ ] Reactive removal
- [ ] Silent deprecation

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


