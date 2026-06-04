# Decomposition: Worker Pool Sizing

## Topic Overview
Worker pool sizing determines how many concurrent PHP processes (workers) handle requests or process queue jobs. Whether using PHP-FPM, Octane, or queue workers, correct sizing balances memory availability against concurrency needs. Under-sized pools cause request queuing and latency; over-sized pools waste memory and cause context-switching overhead. Optimal sizing directly reduces server count by maximizing throughput per instance.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-07-worker-pool-sizing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Worker Pool Sizing
- **Purpose:** Worker pool sizing determines how many concurrent PHP processes (workers) handle requests or process queue jobs. Whether using PHP-FPM, Octane, or queue workers, correct sizing balances memory availability against concurrency needs. Under-sized pools cause request queuing and latency; over-sized pools waste memory and cause context-switching overhead. Optimal sizing directly reduces server count by maximizing throughput per instance.
- **Difficulty:** Foundation
- **Dependencies:** - PHP-FPM Tuning (ku-03), - Octane Resource Usage (ku-05), - Queue Worker Scaling (ku-10), - Context Switching (ku-08)

## Dependency Graph
**Depends on:**
- PHP-FPM Tuning (ku-03)
- Octane Resource Usage (ku-05)
- Queue Worker Scaling (ku-10)
- Context Switching (ku-08)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- CPU-bound pool: Workers = CPU cores (image processing, PDF generation, complex calculations)
- I/O-bound pool: Workers = 2-3x CPU cores (API calls, database queries, cache lookups)
- Memory-bound pool: Workers = Available RAM / worker_memory (large-file processing, memory-heavy jobs)
- Queue workers: Workers = 2-4x CPU cores (high I/O wait from SQS/Database)
- Octane workers: Workers = CPU cores (persistent process, less I/O wait)
**Out of scope:**
- Workers > 4x CPU cores: Context switching overhead destroys throughput gains
- Workers > RAM / 50MB: memory exhaustion causes OOM kills (PHP-FPM)
- Single worker for all queues: Different queue priorities need different worker counts
- Static worker count for variable load: Use dynamic scaling or queue autoscaling
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization