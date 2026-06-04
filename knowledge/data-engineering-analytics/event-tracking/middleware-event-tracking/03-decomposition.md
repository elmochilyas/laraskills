# Decomposition: Middleware-Based Event Tracking Patterns

## Topic Overview
Middleware-based event tracking captures user actions (page views, clicks, API calls) non-blockingly via Laravel's `terminate()` middleware hook, firing after the HTTP response is sent to the client. This is the primary ingestion pattern for analytics in Laravel because it decouples tracking latency from user-facing response time. The pattern is foundational — every analytics package in the ecosystem builds on it, and understanding its guarantees and limitations is prerequisite to architecting any analytics pipeline.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k001-middleware-event-tracking/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Middleware-Based Event Tracking Patterns
- **Purpose:** Middleware-based event tracking captures user actions (page views, clicks, API calls) non-blockingly via Laravel's `terminate()` middleware hook, firing after the HTTP response is sent to the client.
- **Difficulty:** Foundation
- **Dependencies:** K002 (Queue Dispatching): Direct dependency — middleware hands off to queues, K018 (Multi-Tenancy Analytics): Extends middleware with tenant resolution, K022 (GDPR Compliance): IP anonymization and consent checks in middleware, K034 (Circuit Breaker): Rate limiting and failure protection for tracking pipeline

## Dependency Graph
**Depends on:**
- K002 (Queue Dispatching): Direct dependency — middleware hands off to queues
- K018 (Multi-Tenancy Analytics): Extends middleware with tenant resolution
- K022 (GDPR Compliance): IP anonymization and consent checks in middleware
- K034 (Circuit Breaker): Rate limiting and failure protection for tracking pipeline

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- `terminate()` vs `handle()`:
- Synchronous vs async dispatch:
- Request context:
- Global vs route middleware:
- Stateless constraint:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K002 (Queue Dispatching): Direct dependency — middleware hands off to queues, K018 (Multi-Tenancy Analytics): Extends middleware with tenant resolution, K022 (GDPR Compliance): IP anonymization and consent checks in middleware, K034 (Circuit Breaker): Rate limiting and failure protection for tracking pipeline

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization