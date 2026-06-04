# Decomposition: 10.12 Connection behavior in PHP-FPM vs. Octane vs. Swoole

## Topic Overview
PHP-FPM: new connection per request (connect + disconnect overhead). Octane: persistent connections per worker (connect once, reuse). Swoole: coroutine-based connection pooling (shared pool across coroutines).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-12-php-fpm-vs-octane-vs-swoole/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.12 Connection behavior in PHP-FPM vs. Octane vs. Swoole
- **Purpose:** PHP-FPM: new connection per request (connect + disconnect overhead). Octane: persistent connections per worker (connect once, reuse).
- **Difficulty:** Advanced
- **Dependencies:** 10.2 Pool architecture, 10.4 Octane pool, 6.16 Swoole coroutine dispatch

## Dependency Graph
**Depends on:** "10.2 Pool architecture", "10.4 Octane pool", "6.16 Swoole coroutine dispatch"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **PHP-FPM**: Short-lived process. Connection per request. Total connections = (workers × connections per request). High overhead. Server-side pooling required.; - **Octane**: Long-lived worker. Connection pool per worker. Total connections = (workers × pool size). Built-in pooling. No external pooler needed.; - **Swoole**: Coroutine-based. Shared connection pool across coroutines. Total connections = pool size (shared, not per worker). Most efficient..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization