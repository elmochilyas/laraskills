# Decomposition: advanced rate limiting

## Topic Overview

Advanced rate limiting algorithms — sliding window log, sliding window counter, and token bucket — provide more precise traffic shaping than Laravel's built-in fixed-window algorithm. The fixed window (default) allows burst traffic at window boundaries: 100 requests at 11:59:59 and 100 more at 12:00:00 pass through before the window resets. Sliding window algorithms smooth this by tracking requests continuously (window log) or interpolating between windows (sliding counter). Token bucket ...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
advanced-rate-limiting/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### advanced rate limiting
- **Purpose:** Advanced rate limiting algorithms — sliding window log, sliding window counter, and token bucket — provide more precise traffic shaping than Laravel's built-in fixed-window algorithm. The fixed window (default) allows burst traffic at window boundaries: 100 requests at 11:59:59 and 100 more at 12:00:00 pass through before the window resets. Sliding window algorithms smooth this by tracking requests continuously (window log) or interpolating between windows (sliding counter). Token bucket ...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Rate limiter facade and throttle middleware, Redis cache configuration, Related: Plan-aware throttling for SaaS APIs, Custom rate limiter implementations, Advanced Follow-up: Distributed token bucket with Redis Cluster, Lua scripting patterns for rate limiting, and gRPC-level rate limiting for microservices

## Dependency Graph
**Depends on:** Prerequisites: Rate limiter facade and throttle middleware, Redis cache configuration, Related: Plan-aware throttling for SaaS APIs, Custom rate limiter implementations, Advanced Follow-up: Distributed token bucket with Redis Cluster, Lua scripting patterns for rate limiting, and gRPC-level rate limiting for microservices
**Depended on by:** Knowledge units that leverage or extend advanced rate limiting patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for advanced rate limiting.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization