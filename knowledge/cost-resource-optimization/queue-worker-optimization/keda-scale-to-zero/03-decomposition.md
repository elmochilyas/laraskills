# Decomposition: KEDA Scale-to-Zero Workers

## Topic Overview
KEDA (Kubernetes Event-Driven Autoscaling) enables scale-to-zero for queue workers Ã¢â‚¬â€ when no queue messages exist, worker pods scale down to zero, incurring zero compute cost. This eliminates the baseline cost of idle queue workers. KEDA integrates with SQS, RabbitMQ, Redis, and 50+ event sources.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k45-keda-scale-to-zero/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### KEDA Scale-to-Zero Workers
- **Purpose:** KEDA (Kubernetes Event-Driven Autoscaling) enables scale-to-zero for queue workers Ã¢â‚¬â€ when no queue messages exist, worker pods scale down to zero, incurring zero compute cost.
- **Difficulty:** Intermediate
- **Dependencies:** K10: SQS Pricing Model, K25: Fargate Spot Workers, K14: RabbitMQ Alternative

## Dependency Graph
**Depends on:**
- K10: SQS Pricing Model
- K25: Fargate Spot Workers
- K14: RabbitMQ Alternative

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Scale-to-zero
- Scalers
- Cooldown period
- Target metric
- Kubernetes-only
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K10: SQS Pricing Model, K25: Fargate Spot Workers, K14: RabbitMQ Alternative

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