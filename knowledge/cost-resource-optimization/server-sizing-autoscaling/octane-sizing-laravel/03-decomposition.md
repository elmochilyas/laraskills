# Decomposition: Octane Sizing for Laravel (Server Sizing)

## Topic Overview
A typical Laravel Octane server at 2 vCPU / 4GB RAM handles ~500-1000 concurrent users with sub-100ms response times. Octane's in-memory architecture changes server sizing: workers replace PHP-FPM processes, and the worker-to-CPU ratio is critical. For CPU-bound apps, use n+1 workers (n = vCPU count); for I/O-bound apps, use 2n to 4n workers.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k38-octane-sizing-laravel/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Octane Sizing for Laravel (Server Sizing)
- **Purpose:** A typical Laravel Octane server at 2 vCPU / 4GB RAM handles ~500-1000 concurrent users with sub-100ms response times.
- **Difficulty:** Intermediate
- **Dependencies:** K38: Laravel Octane Throughput, K37: Predictive Scaling, K50: Scheduled Scaling

## Dependency Graph
**Depends on:**
- K38: Laravel Octane Throughput
- K37: Predictive Scaling
- K50: Scheduled Scaling

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- 2 vCPU / 4GB baseline
- Worker count
- Per-worker memory
- Connection pooling
- vs PHP-FPM sizing
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K38: Laravel Octane Throughput, K37: Predictive Scaling, K50: Scheduled Scaling

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