# Decomposition: Worker Failure Cost

## Topic Overview
Worker failures (job exceptions, timeouts, memory exhaustion, Spot interruptions) waste compute resources and delay job completion. Each failed job consumes processing time without producing results. For Laravel applications, unhandled exceptions, infinite retries, and Poison Pill messages (messages that always fail) can consume significant worker capacity. Effective failure handling reduces wasted compute by 80% and improves job throughput.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-07-worker-failure-cost/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Worker Failure Cost
- **Purpose:** Worker failures (job exceptions, timeouts, memory exhaustion, Spot interruptions) waste compute resources and delay job completion. Each failed job consumes processing time without producing results. For Laravel applications, unhandled exceptions, infinite retries, and Poison Pill messages (messages that always fail) can consume significant worker capacity. Effective failure handling reduces wasted compute by 80% and improves job throughput.
- **Difficulty:** Foundation
- **Dependencies:** - Spot Worker (ku-05), - Queue Priority Cost (ku-04), - Throughput Optimization (ku-06)

## Dependency Graph
**Depends on:**
- Spot Worker (ku-05)
- Queue Priority Cost (ku-04)
- Throughput Optimization (ku-06)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- DLQ: Always implement for every queue (prevent poison pill infinite loops)
- Backoff/retry limiting: All jobs that may have transient failures (network, API rate limits)
- Job timeout: Long-running jobs that may hang
- Visibility timeout tuning: Workers with variable job durations
- Failure monitoring: Production queue processing with >0.1% failure rate
- Graceful termination: Spot-based workers with interruption handling
**Out of scope:**
- No retry for idempotent critical jobs: Payment jobs should retry; don't send to DLQ on first failure
- Too-fast retry: Retrying every second; API rate limits will still fail; use exponential backoff
- No DLQ for low-traffic queues: If queue processes 10 jobs/day, poisoning is less impactful but still implement DLQ
- Endless retries: Don't set max_attempts to "unlimited" (infinite waste on poison pills)
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