# Decomposition: Worker Scaling

## Topic Overview
Worker scaling adjusts the number of queue worker processes to match the volume of queued jobs. Under-provisioned workers cause job backlog (hours of latency). Over-provisioned workers waste compute resources (paying for idle capacity). For Laravel applications using SQS, auto-scaling workers based on queue depth is the most effective cost optimization: workers exist only when there is work to do.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-01-worker-scaling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Worker Scaling
- **Purpose:** Worker scaling adjusts the number of queue worker processes to match the volume of queued jobs. Under-provisioned workers cause job backlog (hours of latency). Over-provisioned workers waste compute resources (paying for idle capacity). For Laravel applications using SQS, auto-scaling workers based on queue depth is the most effective cost optimization: workers exist only when there is work to do.
- **Difficulty:** Foundation
- **Dependencies:** - Batch Processing (ku-02), - Auto Scaling Workers (ku-03), - Spot Worker (ku-05), - Throughput Optimization (ku-06)

## Dependency Graph
**Depends on:**
- Batch Processing (ku-02)
- Auto Scaling Workers (ku-03)
- Spot Worker (ku-05)
- Throughput Optimization (ku-06)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Auto-scaling workers: Variable queue load; batch jobs, user-triggered processing, scheduled tasks
- Manual workers: Constant, predictable queue load (always 500 jobs waiting)
- Scheduled workers: Known processing windows (month-end reports, daily digest emails)
- Spot workers: Fault-tolerant workloads; save 60-90% vs On-Demand
- KEDA scaling: Kubernetes-based workers; event-driven scaling
**Out of scope:**
- Auto-scaling for stable load: If queue depth is always 100-200, fixed worker count is simpler
- Auto-scaling without min workers: Setting min=0 means cold start on every job (queue processing delayed 2-5 minutes)
- Overly aggressive scaling: Adding/removing workers every 30 seconds causes thrashing
- Scaling on queue depth alone: Consider job complexity; 1000 simple jobs vs 10 complex jobs need different scaling
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