# Decomposition: Auto Scaling Workers

## Topic Overview
Auto Scaling Workers automatically adjusts the number of queue worker instances based on SQS queue depth. Unlike web server auto-scaling (which scales on CPU or request count), worker scaling responds to job backlog. For Laravel applications with variable queue load (batch jobs, user-triggered processing, scheduled tasks), auto-scaling workers eliminate idle compute costs during low traffic while ensuring job throughput during peaks. Combined with Spot instances, this is the single biggest cost optimization for queue processing.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-03-auto-scaling-workers/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Auto Scaling Workers
- **Purpose:** Auto Scaling Workers automatically adjusts the number of queue worker instances based on SQS queue depth. Unlike web server auto-scaling (which scales on CPU or request count), worker scaling responds to job backlog. For Laravel applications with variable queue load (batch jobs, user-triggered processing, scheduled tasks), auto-scaling workers eliminate idle compute costs during low traffic while ensuring job throughput during peaks. Combined with Spot instances, this is the single biggest cost optimization for queue processing.
- **Difficulty:** Foundation
- **Dependencies:** - Worker Scaling (ku-01), - Spot Worker (ku-05), - KEDA Scaling

## Dependency Graph
**Depends on:**
- Worker Scaling (ku-01)
- Spot Worker (ku-05)
- KEDA Scaling

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- ASG scaling: EC2-based queue workers; full control over instance types
- ECS Service scaling: Fargate-based workers; simpler, containerized
- KEDA scaling: Kubernetes-based workers; event-driven, fine-grained
- Target tracking: Simple metric-to-capacity mapping; works for most apps
- Step scaling: Complex workloads with different response needs per backlog level
- Scheduled scaling: Known batch windows (pre-scale before expected backlog)
**Out of scope:**
- Manual worker adjustment: Always automate; manual scaling causes over/under-provisioning
- CPU-based scaling for workers: Worker CPU doesn't correlate with job backlog; use SQS depth directly
- KEDA for simple apps: KEDA adds Kubernetes complexity; ASG/ECS scaling is simpler for EC2/Fargate
- Instant scale-in: Terminating workers as soon as queue clears causes mid-job terminations
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