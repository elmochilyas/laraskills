# Decomposition: Cpu Vs Io Bound Worker Ratios

## Topic Overview
The optimal number of workers per CPU core depends on whether the workload is **CPU-bound** (workers are always computing — need fewer workers than cores) or **I/O-bound** (workers spend most time waiting — need more workers to utilize cores during wait time). Rule of thumb: 2-4 workers per core for CPU-bound, 8-12 per core for I/O-bound.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-fpm-worker-management/cpu-vs-io-bound-worker-ratios/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Cpu Vs Io Bound Worker Ratios
- **Purpose:** The optimal number of workers per CPU core depends on whether the workload is **CPU-bound** (workers are always computing — need fewer workers than cores) or **I/O-bound** (workers spend most time waiting — need more workers to utilize cores during wait time). Rule of thumb: 2-4 workers per core for CPU-bound, 8-12 per core for I/O-bound.
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
  - Workload classification
  - Assuming "more workers = more throughput"
  - Restaurant kitchen model
  - Monitor-then-size

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