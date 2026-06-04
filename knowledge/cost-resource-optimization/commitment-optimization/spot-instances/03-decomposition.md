# Decomposition: Spot Instances

## Topic Overview
Spot instances offer 60-90% discounts on EC2/Fargate in exchange for potential interruptions (2-minute warning). For Laravel applications, spot instances are ideal for stateless workloads: queue workers, batch processing, CI/CD runners, and web server auto-scaling capacity. The key challenge is handling interruptions gracefully through checkpointing, graceful shutdown signals, and diversification across instance types.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-02-spot-instances/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Spot Instances
- **Purpose:** Spot instances offer 60-90% discounts on EC2/Fargate in exchange for potential interruptions (2-minute warning). For Laravel applications, spot instances are ideal for stateless workloads: queue workers, batch processing, CI/CD runners, and web server auto-scaling capacity. The key challenge is handling interruptions gracefully through checkpointing, graceful shutdown signals, and diversification across instance types.
- **Difficulty:** Foundation
- **Dependencies:** - Reserved Instances (ku-01), - Auto Scaling Policies (ku-03), - Queue Worker Scaling (ku-10)

## Dependency Graph
**Depends on:**
- Reserved Instances (ku-01)
- Auto Scaling Policies (ku-03)
- Queue Worker Scaling (ku-10)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Spot: Queue workers (SQS consumers can be retried on interruption)
- Spot: Web server fleet scaling capacity (baseline on RI, burst on Spot)
- Spot: CI/CD build runners (interruption = rebuild, acceptable)
- Spot: Data processing and batch jobs
- Spot: Staging/development environments (low cost, acceptable interruption)
- Fargate Spot: Serverless containers at 70% discount (less granular control but simpler)
**Out of scope:**
- Spot: Stateful workloads (databases, Redis, stateful web servers with local session storage)
- Spot: Time-critical production traffic where interruption causes revenue loss
- Spot: Workloads with long-running critical processes that cannot be interrupted
- Spot: Single-instance deployments (no redundancy to handle interruptions)
- Spot: Workloads requiring specific instance types that are frequently scarce
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