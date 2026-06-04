# Decomposition: Spot Worker

## Topic Overview
Spot Workers use EC2 Spot or Fargate Spot instances for queue processing, reducing compute costs by 60-90% compared to On-Demand. Queue workers are ideal for Spot because they are stateless (jobs can be retried on interruption), fault-tolerant (SQS handles retries), and can be interrupted without user impact. For Laravel applications, the worker fleet (queue processing, batch jobs, cron replacements) is often the largest compute cost, and converting to Spot can save thousands per month.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-05-spot-worker/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Spot Worker
- **Purpose:** Spot Workers use EC2 Spot or Fargate Spot instances for queue processing, reducing compute costs by 60-90% compared to On-Demand. Queue workers are ideal for Spot because they are stateless (jobs can be retried on interruption), fault-tolerant (SQS handles retries), and can be interrupted without user impact. For Laravel applications, the worker fleet (queue processing, batch jobs, cron replacements) is often the largest compute cost, and converting to Spot can save thousands per month.
- **Difficulty:** Foundation
- **Dependencies:** - Reserved Instances (ku-01 in compute-commitment), - Worker Scaling (ku-01), - Worker Failure Cost (ku-07)

## Dependency Graph
**Depends on:**
- Reserved Instances (ku-01 in compute-commitment)
- Worker Scaling (ku-01)
- Worker Failure Cost (ku-07)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- EC2 Spot: Large worker fleets (>10 instances); maximum cost savings; full control
- Fargate Spot: Containerized workers; less operational overhead; simpler scaling
- Queue workers: Always default to Spot (fault-tolerant = interruption-safe)
- CI/CD runners: Spot is ideal (interruption = pipeline re-run)
- Data processing: Batch jobs that can be retried from checkpoint
- Web server overflow: Spot for ASG scaling beyond RI baseline
**Out of scope:**
- Spot for stateful workers: Workers holding local state (database connections are fine; in-memory state is not)
- Spot for time-critical jobs: If job must complete in <30 seconds and interruption causes SLA breach
- Spot without fallback: 100% Spot with no On-Demand capacity; if Spot is unavailable, workers stop
- Spot for long-running critical processes: Jobs that run > 15 minutes risk interruption mid-process
- Spot for database or cache: Stateful services must not use Spot
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