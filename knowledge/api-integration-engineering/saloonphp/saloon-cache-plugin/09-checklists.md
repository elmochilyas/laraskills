# Metadata

**Domain:** api-integration-engineering
**Subdomain:** saloonphp
**Knowledge Unit:** saloon-cache-plugin
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Auth endpoints excluded from cache configuration
- [ ] Cache hit rate telemetry reports to monitoring system
- [ ] Cache hit returns response without HTTP call to upstream
- [ ] Enable Conditional Caching for ETag-Supporting APIs
- [ ] Exclude Non-GET and Auth Requests from Caching
- [ ] Implement Targeted Cache Invalidation via Webhooks
- [ ] Monitor Cache Hit Rate as a Key Metric
- [ ] Set TTL Per Endpoint, Not Per Connector
- [ ] `CachingPlugin` added to Saloon Connector
- [ ] Cache hit/miss metrics logged
- [ ] Cache invalidation on relevant data changes
- [ ] Add `CachingPlugin` to Connector: `protected ?string $cachePlugin = CachingPlugin::class`
- [ ] Configure cache key strategy (query params, headers)
- [ ] Configure invalidation: manual clear or webhook-triggered

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add `CachingPlugin` to Connector: `protected ?string $cachePlugin = CachingPlugin::class`
- [ ] Configure cache key strategy (query params, headers)
- [ ] Configure invalidation: manual clear or webhook-triggered
- [ ] Configure TTL on the plugin: `->setTtl(300)`
- [ ] Install cache plugin: `composer require saloonphp/cache-plugin`
- [ ] Log cache hit/miss for monitoring
- [ ] Test cached vs non-cached response times
- [ ] Enable Conditional Caching for ETag-Supporting APIs
- [ ] Exclude Non-GET and Auth Requests from Caching
- [ ] Implement Targeted Cache Invalidation via Webhooks
- [ ] Monitor Cache Hit Rate as a Key Metric
- [ ] Set TTL Per Endpoint, Not Per Connector

---

# Performance Checklist

- [ ] Cache hit: sub-millisecond (in-memory) to 5ms (Redis) â€” significantly faster than API call (50-5000ms)
- [ ] Cache key computation: ~0.01ms per request (MD5 hash of connector + request + serialized params)
- [ ] Cache stampede protection: use lock-based cache rebuild for high-traffic endpoints to prevent concurrent cache misses
- [ ] Cache write: 5-20ms depending on response size and store
- [ ] Conditional request (304): eliminates response body transfer â€” bandwidth savings of 90%+ for unchanged data

---

# Security Checklist

- [ ] Authentication responses must never be cached; stale auth data can authorize revoked sessions
- [ ] Cache key must include user identity for user-scoped endpoints to prevent data leakage between users
- [ ] Never cache responses containing PII, tokens, or user-specific data in shared stores
- [ ] Use encrypted Redis connections (TLS) for production cache stores containing sensitive API data
- [ ] Validate that cache exclusion list covers all endpoints handling sensitive operations

---

# Reliability Checklist

- [ ] Reliability measures implemented

---

# Testing Checklist

- [ ] `CachingPlugin` added to Saloon Connector
- [ ] Auth endpoints excluded from cache configuration
- [ ] Cache hit rate telemetry reports to monitoring system
- [ ] Cache hit returns response without HTTP call to upstream
- [ ] Cache hit/miss metrics logged
- [ ] Cache invalidation clears specific entries via tag/key, not full flush
- [ ] Cache invalidation on relevant data changes
- [ ] Cache key strategy handles different query params
- [ ] Conditional caching (ETag) returns cached response on 304
- [ ] Non-GET requests bypass cache and always reach upstream

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Cache-All Connector â€” Caching POST and Auth Requests]
- [ ] [Uniform TTL for All Endpoints]
- [ ] [Blind Invalidation on Every Mutation (Full Cache Flush)]
- [ ] [Caching Without Hit-Rate Monitoring]
- [ ] [User Data in Shared Cache Without Context Isolation]
- [ ] Blind Invalidation on Every Mutation
- [ ] Cache-All Connector
- [ ] Caching Without Monitoring
- [ ] Zero-TTL Caching

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


