# Metadata

**Domain:** api-integration-engineering
**Subdomain:** sdk-generation
**Knowledge Unit:** 08-sdk-generation
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Connector defines base URL, default headers, auth, timeout, and middleware
- [ ] Contract tests run against sandbox API in CI; mock tests run locally
- [ ] DTOs handle nullable fields with explicit null types (not bare string/int)
- [ ] Cache Connector Instances Per Request
- [ ] Handle Nullable Fields Explicitly in DTOs
- [ ] Implement Exception Taxonomy per HTTP Status
- [ ] Keep SDK Separate as Composer Package
- [ ] Log All SDK Calls with Full Context
- [ ] Auth, error handling, logging customized
- [ ] Composer package configured
- [ ] Generated classes compile without errors
- [ ] Choose generator: Saloon generator, OpenAPI Generator, or custom
- [ ] Configure generator: namespace, package name, authentication
- [ ] Customize: add error handling, middleware, logging

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Choose generator: Saloon generator, OpenAPI Generator, or custom
- [ ] Configure generator: namespace, package name, authentication
- [ ] Customize: add error handling, middleware, logging
- [ ] Generate SDK classes (Connectors, Requests, DTOs)
- [ ] Obtain OpenAPI spec for the API
- [ ] Package as Composer package with `composer.json`
- [ ] Publish to Packagist or private repository
- [ ] Version SDK alongside API version
- [ ] Cache Connector Instances Per Request
- [ ] Handle Nullable Fields Explicitly in DTOs
- [ ] Implement Exception Taxonomy per HTTP Status
- [ ] Keep SDK Separate as Composer Package

---

# Performance Checklist

- [ ] Connector init: ~1-3ms â€” cache per request
- [ ] DTO casting: ~0.1-0.5ms per response (Spatie Data cached)
- [ ] Large response serialization: 10-50ms for >1MB â€” use streaming
- [ ] Pagination: latency proportional to page count â€” prefer parallel fetching
- [ ] Token refresh: 1 extra HTTP call per expiry window â€” cache tokens

---

# Security Checklist

- [ ] Implement token storage encryption (Laravel's encrypt() for DB-stored tokens)
- [ ] Never log API keys, tokens, or credentials in SDK logging middleware
- [ ] Rate limit SDK calls to prevent accidental API abuse
- [ ] Use timing-safe comparison for webhook signature verification in SDK
- [ ] Validate response DTO fields before returning to application

---

# Reliability Checklist

- [ ] Assuming all responses have the same envelope structure
- [ ] Leaking Guzzle/PSR-7 types outside SDK â€” application code must only see SDK types
- [ ] No request logging â€” production debugging becomes guesswork
- [ ] Not handling nullable fields in generated DTOs â€” runtime type errors on null responses
- [ ] Not regenerating SDK after OpenAPI spec changes â€” silent failures
- [ ] Handle Nullable Fields Explicitly in DTOs
- [ ] Implement Exception Taxonomy per HTTP Status
- [ ] Never Leak Guzzle/PSR-7 Types Outside SDK

---

# Testing Checklist

- [ ] Auth, error handling, logging customized
- [ ] Composer package configured
- [ ] Connector defines base URL, default headers, auth, timeout, and middleware
- [ ] Contract tests run against sandbox API in CI; mock tests run locally
- [ ] DTOs handle nullable fields with explicit null types (not bare string/int)
- [ ] Each endpoint has a dedicated Request class with typed response DTO
- [ ] Error handling maps HTTP status codes to typed exceptions (Network, Auth, RateLimit, Validation, Server)
- [ ] Generated classes compile without errors
- [ ] Guzzle/PSR-7 types are not exposed outside the SDK
- [ ] OpenAPI spec obtained and validated

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Fat SDK â€” Business Logic Mixed in Connector Layer]
- [ ] [No Version Strategy â€” SDK Version Misaligned with API Version]
- [ ] [Leaking Guzzle/PSR-7 Types Outside SDK]
- [ ] [No Request Logging Middleware]
- [ ] [Monolithic SDK Package for All API Versions]
- [ ] [Assuming Uniform Response Envelope Structure]
- [ ] [No Nullable Handling in Generated DTOs]
- [ ] [Documentation as Afterthought]
- [ ] Documentation as Afterthought:
- [ ] Fat SDK:
- [ ] Inconsistent Auth:
- [ ] Monolithic SDK Package:
- [ ] No Version Strategy:

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


