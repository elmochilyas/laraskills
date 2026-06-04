# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Queue Worker Scaling
**Generated:** 2026-06-03

---

# Decision Inventory

1. SQS Queue Depth Auto-Scaling
2. Priority Queue Separation

---

# Architecture-Level Decision Trees

---

## Decision Name: SQS Queue Depth Auto-Scaling

---

## Decision Context

Configure workers to auto-scale on SQS ApproximateNumberOfMessagesVisible.

---

## Decision Criteria

performance, cost

---

## Decision Tree

Scaling metric?

SQS ApproximateNumberOfMessagesVisible -> Best
Custom backlog -> Alternative for DB queues

Scale-out threshold:

target_latency x jobs_per_worker_per_min
Example: 5min x 10 = scale at depth 50

Scale-in threshold?
10% of scale-out threshold
600s+ cooldown to prevent oscillation

Worker type?
Spot (70% discount) -> Stateless workers
On-Demand -> Time-critical jobs
Mixed (70/30) -> Balanced

---

## Rationale

Latency-based scaling ensures workers are added before backlog exceeds acceptable delay.

---

## Recommended Default

**Default:** Scale-out at depth 1000, add 2; scale-in at depth 100, remove 1; 600s cooldown

---

## Risks Of Wrong Choice

Too aggressive scale-in terminates workers mid-job. No auto-scaling = hours of backlog.

---

## Related Rules

Rule: Follow standardized Queue Worker Scaling practices

---

## Related Skills

Analyze and Optimize Queue Worker Scaling

---

---

## Decision Name: Priority Queue Separation

---

## Decision Context

Design separate scaling policies per queue priority.

---

## Decision Criteria

performance, reliability

---

## Decision Tree

Multiple priorities?

YES -> Separate queues and ASGs
NO -> Single queue sufficient

High priority (email):
Scale at depth 100, min=2, On-Demand

Low priority (reports):
Scale at depth 5000, min=0, Spot

Normal priority (notifications):
Scale at depth 500, 70% Spot + 30% On-Demand

---

## Rationale

Separate ASGs per priority prevent low-priority jobs from starving high-priority queues.

---

## Recommended Default

**Default:** 3 tiers: high (On-Demand, min=2, depth=100); normal (mixed, depth=500); low (Spot, min=0, depth=5000)

---

## Risks Of Wrong Choice

Same scaling for all = cleanup blocks email delivery during batch spikes.

---

## Related Rules

Rule: Follow standardized Queue Worker Scaling practices

---

## Related Skills

Analyze and Optimize Queue Worker Scaling

---

