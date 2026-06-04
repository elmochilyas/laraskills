# Decomposition: Opcache Reset Strategies

## Topic Overview
Three OpCache reset strategies exist: **PHP-FPM restart** (most thorough ? resets everything including preloading, but slowest), **opcache_reset()** (fastest ? clears shared memory opcodes in microseconds, but does not reload preloading), and **cachetool CLI** (remote operation ? calls opcache_reset() via web endpoint on each worker, no SSH needed). Strategy depends on deployment architecture and tolerance for cold-start latency.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
deployment-cache-invalidation/opcache-reset-strategies/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Opcache Reset Strategies
- **Purpose:** Three OpCache reset strategies exist: **PHP-FPM restart** (most thorough ? resets everything including preloading, but slowest), **opcache_reset()** (fastest ? clears shared memory opcodes in microseconds, but does not reload preloading), and **cachetool CLI** (remote operation ? calls opcache_reset() via web endpoint on each worker, no SSH needed). Strategy depends on deployment architecture and tolerance for cold-start latency.
- **Difficulty:** Intermediate
- **Dependencies:
  - FPM Graceful Reload | Preloading Update Procedure | CI/CD Cache Invalidation Steps
  - --

## Dependency Graph
**Depends on:**
  - FPM Graceful Reload | Preloading Update Procedure | CI/CD Cache Invalidation Steps
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Production deployment reset
  - opcache_reset() without restarting PHP-FPM when preloading is used
  - Parking garage model
  - Zero-downtime deployment pipeline

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