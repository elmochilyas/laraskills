# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** VM Sizing
**Generated:** 2026-06-03

---

# Decision Inventory

1. Instance Family Selection
2. Instance Size Right-Sizing via Monitoring
3. Burstable vs Dedicated CPU Decision

---

# Architecture-Level Decision Trees

---

## Decision Name: Instance Family Selection

---

## Decision Context

Choose between Graviton (ARM) and x86 instance families for Laravel workloads.

---

## Decision Criteria

cost, performance, compatibility

---

## Decision Tree

New deployment or existing migration?

NEW -> Use Graviton (m7g/r7g/c7g) -- 20% cheaper, identical PHP performance
EXISTING -> Currently on x86?
  YES -> Has native x86 binary dependencies?
    YES -> Stay on x86 until dependencies are ported
    NO -> Migrate to Graviton via staging first
  NO -> Already optimal

Workload profile?
CPU-bound (image processing) -> c7g instances
Memory-bound (large cache) -> r7g instances
Balanced (web serving) -> m7g instances
Burstable (low traffic) -> t4g instances

---

## Rationale

Graviton offers 20% cost reduction with identical PHP execution performance. Choosing the right instance family matches resources to actual workload requirements.

---

## Recommended Default

**Default:** Graviton m7g for balanced workloads; c7g for CPU-bound; r7g for memory-bound

---

## Risks Of Wrong Choice

Using t4g for sustained production causes CPU credit exhaustion. Wrong family wastes memory, CPU, or network capacity.

---

## Related Rules

Rule: Follow standardized VM Sizing practices

---

## Related Skills

Analyze and Optimize VM Sizing

---

---

## Decision Name: Instance Size Right-Sizing via Monitoring

---

## Decision Context

Determine optimal instance size based on actual utilization metrics over 2-week period.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Current CPU utilization (2-week P95)?

< 20% -> Downsize one tier (xlarge to large)
20-60% -> Current size appropriate
> 60% -> Consider upsizing or scaling out

Memory utilization (peak)?
< 50% -> Reduce instance memory or downsize family
50-80% -> Appropriate sizing
> 80% -> Increase memory or scale out

Traffic pattern?
Steady -> Right-size for average + 20% headroom
Variable -> Use Auto Scaling, size for baseline only

---

## Rationale

Single-day monitoring misses weekend lows and peak hours. Two-week data reveals true baseline and peak, preventing both over-provisioning and under-provisioning.

---

## Recommended Default

**Default:** Start with m7g.large, monitor for 2 weeks, right-size based on P95 utilization

---

## Risks Of Wrong Choice

Sizing for peak without Auto Scaling wastes 40-70% of compute budget on idle capacity.

---

## Related Rules

Rule: Follow standardized VM Sizing practices

---

## Related Skills

Analyze and Optimize VM Sizing

---

---

## Decision Name: Burstable vs Dedicated CPU Decision

---

## Decision Context

Choose between t4g (burstable with CPU credits) and m7g (dedicated CPU) instances.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Average CPU utilization?

< 10% avg with spikes < 50% -> t4g (burstable, 30% savings)
10-20% avg -> t4g possible but monitor credit balance
> 20% avg -> m7g required (t4g will exhaust credits)

Sustained peak duration?
< 30 minutes -> t4g burst credits cover peaks
> 30 minutes -> m7g needed for sustained throughput

Environment?
Dev/staging -> t4g (low utilization, credits accumulate)
Production -> m7g unless workload is truly burstable

---

## Rationale

t4g instances earn CPU credits at 1 credit per vCPU hour. Sustained CPU above 20% depletes credits, throttling performance to baseline.

---

## Recommended Default

**Default:** t4g for dev/staging; m7g for production; only use t4g in production if average CPU < 10%

---

## Risks Of Wrong Choice

t4g in production with sustained load causes CPU credit exhaustion, throttled performance, dropped requests.

---

## Related Rules

Rule: Follow standardized VM Sizing practices

---

## Related Skills

Analyze and Optimize VM Sizing

---

