# Decomposition: Sync Vs Async Io

## Topic Overview
PHP traditionally uses **synchronous (blocking) I/O** — when a database query or HTTP request is made, the PHP process sleeps until the operation completes. Asynchronous I/O (non-blocking with event notification) allows a single process to interleave multiple operations, dramatically improving throughput during I/O wait. This distinction determines the effectiveness of threading, coroutines, and alternative runtimes.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-engine-performance/sync-vs-async-io/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Sync Vs Async Io
- **Purpose:** PHP traditionally uses **synchronous (blocking) I/O** — when a database query or HTTP request is made, the PHP process sleeps until the operation completes. Asynchronous I/O (non-blocking with event notification) allows a single process to interleave multiple operations, dramatically improving throughput during I/O wait. This distinction determines the effectiveness of threading, coroutines, and alternative runtimes.
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
  - I/O-bound workloads benefit most from async
  - Pipeline model
  - Bottleneck-first approach

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