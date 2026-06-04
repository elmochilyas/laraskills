# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Query Optimization & Profiling
**Knowledge Unit:** 4-13 N+1 Detection & Elimination
**Generated:** 2026-06-03

---

# Decision Inventory

* Eager loading vs lazy loading strategy
* Hidden N+1 location identification
* Prevention: guardrails vs detection

---

# Architecture-Level Decision Trees

---

## N+1 Query Elimination Strategy

---

## Decision Context

Detecting and eliminating N+1 query patterns that occur when relationships are lazy-loaded inside loops, in views, or in API resources.

---

## Decision Criteria

* performance: N+1 generates (parent_count + 1) queries instead of 2
* architectural: eager loading should be explicit in controllers
* maintainability: hidden N+1 in views/resources is hardest to catch
* security: no direct impact

---

## Decision Tree

Investigating high query count per request?
↓
Detect repeated query pattern: same query, different WHERE values
↓
Is the N+1 in a Controller?
YES → Use with() to eager load before the loop
    → Post::with('comments')->get() instead of lazy loading in Blade
NO → Is the N+1 in an API Resource?
    YES → Use whenLoaded() to conditionally include relationships
        → Preload relationships in the controller before passing to resource
    NO → Is the N+1 in a Blade view?
        → Eager load in the controller
        → Use $post->relation()->count() instead of $post->relation->count()
↓
Prevention:
→ Enable preventLazyLoading in non-production
→ Assert query count in tests
→ Middleware to log high-query-count requests

---

## Rationale

N+1 is the most common Eloquent performance problem. It's easy to introduce (accessing a relationship in a view) and hard to detect without tooling. Prevention is better than detection: enable strict mode guardrails, assert query counts in tests, and monitor query counts in production.

---

## Recommended Default

**Default:** Enable preventLazyLoading in dev/staging, assert query counts in tests
**Reason:** Prevention catches N+1 at development time. Query count assertions in tests prevent regression. Production monitoring catches edge cases.

---

## Risks Of Wrong Choice

* Hidden N+1 in API resources: invisible from controller — relationship accessed in toArray()
* Blind eager loading: loading relationships that aren't used wastes resources
* No query count assertions: new relationship added to view silently adds N+1

---

## Related Rules

* Enable preventLazyLoading in non-production environments
* Assert query counts in endpoint tests

---

## Related Skills

* Detect and eliminate N+1 queries
