# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Performance vs Cost
**Generated:** 2026-06-03

---

# Decision Inventory

1. Optimization Prioritization (80/20 Rule)
2. Compute Platform Breakeven
3. Cost-Performance Budgets

---

# Architecture-Level Decision Trees

---

## Decision Name: Optimization Prioritization (80/20 Rule)

---

## Decision Context

Identify highest-ROI performance optimizations first.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Profile before optimizing?

YES -> Identify biggest bottleneck
NO -> Profile first (90% of guesses wrong)

Issue type found?
Missing OPcache -> 5 min change, 50-70% CPU reduction
PHP-FPM misconfig -> Config change, 10-30% improvement
Missing DB index -> Add index, 100x speedup
N+1 queries -> Fix eager loading

ROI estimate:
5 min to implement, /month savings -> DO IT
40 hours to implement, /month savings -> SKIP

Order: OPcache -> FPM -> DB indexes -> Queries -> Octane

---

## Rationale

80% of optimization benefit from 20% of changes. OPcache alone gives 50-70% CPU reduction for one config change.

---

## Recommended Default

**Default:** Profile first; implement highest ROI first (OPcache -> FPM -> indexes -> queries -> Octane)

---

## Risks Of Wrong Choice

Optimizing before measuring = 90% chance of fixing the wrong thing.

---

## Related Rules

Rule: Follow standardized Performance vs Cost practices

---

## Related Skills

Analyze and Optimize Performance vs Cost

---

---

## Decision Name: Compute Platform Breakeven

---

## Decision Context

Find cost-optimal platform (Lambda/Fargate/EC2) for workload.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Request volume?

< 100 req/s -> Lambda (scale-to-zero)
100-1000 req/s -> Fargate (balanced)
> 1000 req/s -> EC2 (max price-performance)

Duration per request?
< 100ms -> Lambda efficient
100-500ms -> Standard; breakeven analysis needed
> 500ms -> Fargate/EC2 cheaper

Traffic pattern?
Steady -> EC2 with RIs (up to 66% off)
Variable -> Fargate with auto-scaling
Spiky -> Lambda (scale-to-zero)

Ops overhead?
Lambda: ; Fargate: minimal; EC2: 5-10 hrs/month (-1000)

---

## Rationale

Each platform dominates a specific traffic range. Lambda at low volume, EC2 at high volume, Fargate in the middle.

---

## Recommended Default

**Default:** Lambda < 100 req/s; Fargate 100-1000; EC2 > 1000 with RIs

---

## Risks Of Wrong Choice

Lambda at 1000+ req/s costs 2-3x more than EC2. EC2 for 10 req/s wastes 90% of capacity.

---

## Related Rules

Rule: Follow standardized Performance vs Cost practices

---

## Related Skills

Analyze and Optimize Performance vs Cost

---

---

## Decision Name: Cost-Performance Budgets

---

## Decision Context

Set performance budgets and cost-per-request targets.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Cost per request?

Target < .0001/request for most Laravel apps
Track monthly: total compute / total requests
Trending up = degradation; investigate

Latency budgets?
p50 < 200ms, p95 < 500ms, p99 < 1000ms

CI/CD gates?
YES -> Enforce budgets in pipeline
NO -> Add performance gates

Cost vs latency tradeoff?
10% more latency for 30% cost reduction -> Acceptable
10% latency improvement for 2x cost -> Only if latency impacts revenue

---

## Rationale

Cost per request provides a single health metric. Target < .0001/request gives a baseline for optimization decisions.

---

## Recommended Default

**Default:** Target < .0001/request, p50 < 200ms, p95 < 500ms; review monthly

---

## Risks Of Wrong Choice

No budgets = degradation undetected until users complain or finance flags the bill.

---

## Related Rules

Rule: Follow standardized Performance vs Cost practices

---

## Related Skills

Analyze and Optimize Performance vs Cost

---

