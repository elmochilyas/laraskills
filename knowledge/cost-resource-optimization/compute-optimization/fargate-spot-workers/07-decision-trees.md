# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Fargate Spot Workers
**Generated:** 2026-06-03

---

# Decision Inventory

1. Spot vs On-Demand Worker Mix
2. Graceful Shutdown for Spot Interruption
3. Spot Instance Type Diversification

---

# Architecture-Level Decision Trees

---

## Decision Name: Spot vs On-Demand Worker Mix

---

## Decision Context

Determine optimal Spot and On-Demand capacity mix for queue workers.

---

## Decision Criteria

cost, reliability

---

## Decision Tree

Worker characteristics?

Stateless, interruptible -> High Spot (70-90%)
Stateful, critical -> Higher On-Demand (50-100%)

Processing SLA?
Best-effort hours -> 100% Spot (maximum savings)
Timely minutes -> 70% Spot + 30% On-Demand
Critical seconds -> 100% On-Demand

Spot interruption tolerance?
Jobs checkpoint -> High Spot OK
No checkpoint -> Lower Spot percentage

Multi-AZ?
3 AZs -> Lower risk (diversified)
Single AZ -> Higher risk; increase On-Demand

---

## Rationale

Spot offers up to 70% discount. Mixed capacity (70/30) ensures baseline throughput during Spot shortages.

---

## Recommended Default

**Default:** 70% Spot + 30% On-Demand for queue workers; 100% Spot for batch with checkpoints

---

## Risks Of Wrong Choice

100% Spot without fallback = queue stops during Spot shortage.

---

## Related Rules

Rule: Follow standardized Fargate Spot Workers practices

---

## Related Skills

Analyze and Optimize Fargate Spot Workers

---

---

## Decision Name: Graceful Shutdown for Spot Interruption

---

## Decision Context

Handle 2-minute SIGTERM warning for Spot capacity reclamation.

---

## Decision Criteria

reliability

---

## Decision Tree

SIGTERM handler implemented?

YES -> Supervisor catches signal for graceful shutdown
NO -> Implement immediately before deploying Spot

Worker timeout?
--timeout=90 on Horizon (fits within 2-minute warning)
Jobs > 120 seconds get interrupted mid-execution

In-flight job handling?
Jobs < 90s -> Finish before termination
Jobs > 90s -> Implement checkpointing in DB

SQS visibility timeout?
Set to max_job_duration x 2
Ensures interrupted jobs become visible for retry

---

## Rationale

AWS sends SIGTERM 2 minutes before reclaiming Spot. Graceful handling allows in-flight jobs to complete or checkpoint.

---

## Recommended Default

**Default:** --timeout=90 on Horizon; SIGTERM handler; checkpoint jobs > 2 minutes

---

## Risks Of Wrong Choice

No graceful shutdown = jobs terminated mid-execution, invisible retries, wasted processing.

---

## Related Rules

Rule: Follow standardized Fargate Spot Workers practices

---

## Related Skills

Analyze and Optimize Fargate Spot Workers

---

---

## Decision Name: Spot Instance Type Diversification

---

## Decision Context

Reduce interruption risk by diversifying instance types and AZs.

---

## Decision Criteria

reliability, cost

---

## Decision Tree

Single instance type?

YES -> Add similar types for diversification
NO -> Already diversified

Instance families?
t4g + m7g (ARM) -> Good base diversification
c7g + r7g -> Add compute/memory optimized

AZ distribution?
Single AZ -> HIGH RISK; distribute across 3 AZs
3 AZs -> Low risk; continue monitoring

Interruption rate?
> 15% weekly -> Diversify more or raise On-Demand
< 10% weekly -> Current strategy effective

---

## Rationale

Spot capacity varies by instance type and AZ. Diversification across types and AZs reduces interruption rate by 40-60%.

---

## Recommended Default

**Default:** 3+ instance types across 3 AZs; monitor SpotInterruptionCount weekly

---

## Risks Of Wrong Choice

Single type in one AZ = all workers interrupted simultaneously during capacity event.

---

## Related Rules

Rule: Follow standardized Fargate Spot Workers practices

---

## Related Skills

Analyze and Optimize Fargate Spot Workers

---

