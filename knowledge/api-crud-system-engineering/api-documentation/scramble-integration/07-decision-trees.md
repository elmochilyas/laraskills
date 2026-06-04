# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Documentation
**Knowledge Unit:** Scramble Integration
**Generated:** 2026-06-03

---

# Decision Inventory

* Spec caching strategy (development vs production)
* Route exposure (protected vs public docs endpoint)

---

# Architecture-Level Decision Trees

---

## Spec Caching Strategy — Development vs Production

---

## Decision Context

How should the generated OpenAPI spec be cached? Arises when configuring Scramble in different environments.

---

## Decision Criteria

* freshness — development needs immediate updates on code change
* performance — production should not regenerate on every request
* deployment — regeneration step must fit in CI pipeline
* cache invalidation — knowing when to re-cache

---

## Decision Tree

Is the environment development or production?
↓
Development → Runtime generation on first request after code change (no explicit cache)
Production → `php artisan scramble:cache` in deployment pipeline + serve cached spec

---

## Recommended Default

**Default:** Uncached in development; cached static file in production
**Reason:** Development benefits from live regeneration; production needs performance and consistency.

---

## Risks Of Wrong Choice

Production runtime generation: 200-500ms added to first request. Development cache: stale docs during development.

---

## Route Exposure — Protected vs Public Docs Endpoint

---

## Decision Context

Should the built-in Scramble Swagger UI route be publicly accessible? Arises when deploying Scramble-generated documentation.

---

## Decision Criteria

* security — exposing full API surface to unauthorized users
* consumer access — external developers need documentation access
* convenience — built-in docs route is zero-config
* control — authentication and rate limiting on docs endpoint

---

## Decision Tree

Is the API public (external developers consume it)?
↓
YES → Public docs route (consumers need access) + rate limiting
NO → Internal API → Protect docs route with authentication middleware

---

## Recommended Default

**Default:** Protect docs route with authentication in non-public APIs; public with rate limiting for public APIs
**Reason:** Prevents unauthorized API surface discovery while maintaining consumer access.

---

## Risks Of Wrong Choice

Public docs for internal API: competitors or attackers see full API surface. Protected docs for public API: consumers cannot discover endpoints.

---

*Related rules and skills are not available for this KU (no 05-rules.md or 06-skills.md files).*
