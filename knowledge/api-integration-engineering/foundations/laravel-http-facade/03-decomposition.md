# Decomposition: Laravel Http Facade API (get, post, put, patch, delete, pool, concurrent)

## Topic Overview
Laravel's Http facade provides an expressive, fluent API built on top of Guzzle for making outgoing HTTP requests. It abstracts away low-level Guzzle configuration while exposing key capabilities: macroable customization, connection pooling, async/concurrent requests, automatic retry, configurable timeouts, middleware hooks, and a comprehensive faking system for testing.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k001-laravel-http-facade/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel Http Facade API (get, post, put, patch, delete, pool, concurrent)
- **Purpose:** Laravel's Http facade provides an expressive, fluent API built on top of Guzzle for making outgoing HTTP requests. It abstracts away low-level Guzzle configuration while exposing key capabilities: macroable customization, connection pooling, async/concurrent requests, automatic retry, configurable timeouts, middleware hooks, and a comprehensive faking system for testing.
- **Difficulty:** Intermediate
- **Dependencies:** K002, K004, K028, K029

## Dependency Graph
**Depends on:**
- K002
- K004
- K028
- K029

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- The Http facade proxies to `Illuminate\Http\Client\Factory` which manages Guzzle client instances
- Every request method (get, post, put, patch, delete, head) returns `Illuminate\Http\Client\Response`
- Connection pooling via `pool()` allows concurrent request execution with result aggregation
- Http::fake()
- Macros extend the facade with custom methods via `Http
- Global and per-request middleware hooks via `withRequestMiddleware`/`withResponseMiddleware`

**Out of scope:**
- K002 topics covered in their respective KUs
- K004 topics covered in their respective KUs
- K028 topics covered in their respective KUs
- K029 topics covered in their respective KUs

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