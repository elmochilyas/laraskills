# Decomposition: Queue Priority Cost

## Topic Overview
Queue priority determines which jobs are processed first. For Laravel applications, mixing time-sensitive jobs (password reset emails, payment confirmations) with batch jobs (report generation, cleanup tasks) on the same queue causes priority inversion: urgent jobs wait behind non-urgent ones. Using separate queues with different worker configurations ensures high-priority jobs get faster processing while low-priority jobs use cheaper, slower resources.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-04-queue-priority-cost/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Queue Priority Cost
- **Purpose:** Queue priority determines which jobs are processed first. For Laravel applications, mixing time-sensitive jobs (password reset emails, payment confirmations) with batch jobs (report generation, cleanup tasks) on the same queue causes priority inversion: urgent jobs wait behind non-urgent ones. Using separate queues with different worker configurations ensures high-priority jobs get faster processing while low-priority jobs use cheaper, slower resources.
- **Difficulty:** Foundation
- **Dependencies:** - Worker Scaling (ku-01), - Spot Worker (ku-05), - Worker Failure Cost (ku-07)

## Dependency Graph
**Depends on:**
- Worker Scaling (ku-01)
- Spot Worker (ku-05)
- Worker Failure Cost (ku-07)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Separate queues: Apps with 3+ job types with different latency requirements
- Priority worker pools: High-priority (email, payments) and low-priority (reports, cleanup, logs)
- Spotify workers: Low-priority queues using Spot instances (save 70%, acceptable interruption)
- Job class prioritization: Route specific job classes to specific queues
- Batched non-urgent jobs: Low-priority jobs can be batched for efficiency
**Out of scope:**
- Single queue for all jobs: If all jobs have same latency requirements, prioritization adds complexity
- Too many priority levels: > 3 levels adds management overhead; stick with high/default/low
- Over-provisioning low-priority: Low-priority workers should be minimal; backpressure is acceptable
- Priority queues without monitoring: If you can't see backlog per queue, prioritization is blind
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