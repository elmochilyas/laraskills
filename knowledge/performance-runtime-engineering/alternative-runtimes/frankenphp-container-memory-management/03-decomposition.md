# Decomposition: Frankenphp Container Memory Management

## Topic Overview
FrankenPHP in containers requires understanding **two memory systems**: Go runtime memory (Caddy, TLS, goroutines) and PHP memory (threads, OpCache, per-request allocations). `GOMEMLIMIT` controls Go's memory limit (available since Go 1.19+). PHP thread memory is controlled by `num_threads/max_threads` and `memory_limit`. The CGO bridge adds memory pinning complexity — Go GC must not reclaim memory being used by PHP threads.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
alternative-php-runtimes/frankenphp-container-memory-management/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Frankenphp Container Memory Management
- **Purpose:** FrankenPHP in containers requires understanding **two memory systems**: Go runtime memory (Caddy, TLS, goroutines) and PHP memory (threads, OpCache, per-request allocations). `GOMEMLIMIT` controls Go's memory limit (available since Go 1.19+). PHP thread memory is controlled by `num_threads/max_threads` and `memory_limit`. The CGO bridge adds memory pinning complexity — Go GC must not reclaim memory being used by PHP threads.
- **Difficulty:** Intermediate
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Container resource config
  - Using Alpine (musl) for production FrankenPHP
  - Vehicle model
  - Runtime selection flow

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

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