# Decomposition: Opcache Hit Rate Cpu Relationship

## Topic Overview
When OpCache hit rate drops, every miss triggers file compilation — a CPU-intensive operation. Lower hit rates directly increase CPU load as the Zend Engine recompiles uncached files on every request. This creates a **performance death spiral**: as traffic increases, more cache misses occur (if under-provisioned), increasing CPU load, which slows request processing, causing queue buildup.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opcache-configuration/opcache-hit-rate-cpu-relationship/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Opcache Hit Rate Cpu Relationship
- **Purpose:** When OpCache hit rate drops, every miss triggers file compilation — a CPU-intensive operation. Lower hit rates directly increase CPU load as the Zend Engine recompiles uncached files on every request. This creates a **performance death spiral**: as traffic increases, more cache misses occur (if under-provisioned), increasing CPU load, which slows request processing, causing queue buildup.
- **Difficulty:** Foundation
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - OpCache thrashing
  - Diagnosing CPU spikes without checking OpCache
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