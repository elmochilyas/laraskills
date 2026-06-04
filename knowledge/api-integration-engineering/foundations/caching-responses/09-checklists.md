# Metadata

**Domain:** api-integration-engineering
**Subdomain:** foundations
**Knowledge Unit:** caching-responses
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Cache invalidation triggered by relevant data changes
- [ ] Cache keys include service namespace and parameter hash
- [ ] Cache stampede protection implemented
- [ ] Always Set TTL Based on Data Freshness Requirements
- [ ] Design Cache Keys with Service Namespace
- [ ] Don't Cache POST Responses Without Idempotency
- [ ] Implement Stampede Protection with Cache::lock()
- [ ] Use Cache Invalidation via Webhook Events
- [ ] Cache hit/miss metrics logged
- [ ] Cache invalidation on relevant webhook events
- [ ] Cache keys normalized (sorted params, no auth-specific keys)
- [ ] Add cache hit/miss logging for observability
- [ ] Choose cache key strategy: normalize query params, include version
- [ ] For SaloonPHP: use `saloon-cache-plugin` for automatic caching

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add cache hit/miss logging for observability
- [ ] Choose cache key strategy: normalize query params, include version
- [ ] For SaloonPHP: use `saloon-cache-plugin` for automatic caching
- [ ] Identify cacheable endpoints (GET, idempotent, slowly changing)
- [ ] Implement cache stampede protection for high-traffic keys
- [ ] Invalidate cache on webhook events or manual refresh
- [ ] Set appropriate TTL based on data freshness requirements
- [ ] Use `Cache::remember()` for read-through caching
- [ ] Always Set TTL Based on Data Freshness Requirements
- [ ] Design Cache Keys with Service Namespace
- [ ] Don't Cache POST Responses Without Idempotency
- [ ] Implement Stampede Protection with Cache::lock()

---

# Performance Checklist

- [ ] Cache hit: 1-5ms (Redis) vs API call: 50-5000ms
- [ ] Negative caching prevents retry storms at near-zero cost
- [ ] Stampede protection: 5-20ms overhead on cache miss

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Caching POST responses without idempotency
- [ ] No stampede protection (multiple requests all hit upstream on cache miss)
- [ ] Overly complex cache keys with zero hit rate
- [ ] Uniform TTL across all endpoints regardless of data volatility
- [ ] Always Set TTL Based on Data Freshness Requirements

---

# Testing Checklist

- [ ] Cache hit/miss metrics logged
- [ ] Cache invalidation on relevant webhook events
- [ ] Cache invalidation triggered by relevant data changes
- [ ] Cache keys include service namespace and parameter hash
- [ ] Cache keys normalized (sorted params, no auth-specific keys)
- [ ] Cache stampede protection implemented
- [ ] Cacheable endpoints identified and configured
- [ ] Hit rate monitored per service
- [ ] Stampede protection for high-traffic cache keys
- [ ] TTL configured per endpoint based on data freshness requirements

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Uniform TTL Across All Endpoints]
- [ ] [Caching Non-Idempotent POST/PUT/DELETE Responses]
- [ ] [Missing Cache Stampede Protection]
- [ ] [Flat Cache Keys Without Service Namespace]
- [ ] [Passive Expiration Without Webhook-Based Invalidation]

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


