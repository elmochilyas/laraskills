# Decomposition: Opcache Lifecycle Invalidation

## Topic Overview
OpCache invalidation is the process of clearing stale opcodes after code deployment. Three mechanisms exist: `opcache_reset()` (clears entire cache), `opcache_invalidate()` (clears specific file), and PHP-FPM graceful reload (clears OpCache as workers restart). With `validate_timestamps=0`, explicit invalidation is required after every deployment.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opcache-configuration/opcache-lifecycle-invalidation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Opcache Lifecycle Invalidation
- **Purpose:** OpCache invalidation is the process of clearing stale opcodes after code deployment. Three mechanisms exist: `opcache_reset()` (clears entire cache), `opcache_invalidate()` (clears specific file), and PHP-FPM graceful reload (clears OpCache as workers restart). With `validate_timestamps=0`, explicit invalidation is required after every deployment.
- **Difficulty:** Foundation
- **Dependencies:
  - FPM Graceful Reload Patterns | OpCache Reset Strategies | Deployment Cache Invalidation
  - --

## Dependency Graph
**Depends on:**
  - FPM Graceful Reload Patterns | OpCache Reset Strategies | Deployment Cache Invalidation
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Deployment invalidation
  - Using opcache_reset() without warming
  - Library model
  - Tiered cache warming

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