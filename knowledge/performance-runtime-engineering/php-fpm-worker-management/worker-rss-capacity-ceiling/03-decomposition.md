# Decomposition: Worker Rss Capacity Ceiling

## Topic Overview
The server's maximum concurrent request capacity is `pm.max_children` — but this value is constrained by available RAM divided by worker RSS. More workers do not equal more throughput: beyond the optimal point, context switching overhead and memory pressure degrade performance. The capacity ceiling is a product of **worker count × worker RSS = available RAM**.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-fpm-worker-management/worker-rss-capacity-ceiling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Worker Rss Capacity Ceiling
- **Purpose:** The server's maximum concurrent request capacity is `pm.max_children` — but this value is constrained by available RAM divided by worker RSS. More workers do not equal more throughput: beyond the optimal point, context switching overhead and memory pressure degrade performance. The capacity ceiling is a product of **worker count × worker RSS = available RAM**.
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
  - Scaling methodology
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