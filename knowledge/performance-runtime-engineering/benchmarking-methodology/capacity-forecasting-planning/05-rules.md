## Forecast from peak traffic (P95 daily peak), never from average traffic
---
Category: Scalability
---
Use the P95 daily peak requests per second, not the daily average, as the baseline for all capacity forecasting calculations.
---
Reason: Average traffic is typically 30-50% of peak traffic. Sizing for average means the system will be saturated during peak hours every day. The P95 daily peak represents the load level that the system must handle for 5% of the day (~72 minutes) — this is the minimum capacity threshold. Sizing below this guarantees performance degradation during normal daily peaks.
---
Bad Example:
```bash
# Average-based forecast — guarantees saturation
avg_RPS = 1000
projected = 1000 × (1.08)^6 = 1587 RPS  # Saturated at current peak of 2000 RPS
```

Good Example:
```bash
# Peak-based forecast
peak_RPS = 2000  # P95 daily peak
projected = 2000 × (1.08)^6 = 3173 RPS  # Sized for actual peak load
```
---
Exceptions: Services with flat, non-peaked traffic patterns may use average if P95 is within 10% of average.
---
Consequences Of Violation: Daily performance degradation during peak hours, user-facing latency spikes, emergency capacity scrambling instead of planned upgrades.

## Include 1.2x-2x safety margins in all capacity calculations
---
Category: Scalability
---
Apply safety margins of 1.2x for normal services, 1.5x for critical services, and 2x for services without auto-scaling to absorb traffic spikes and deployment headroom.
---
Reason: Traffic is inherently unpredictable — marketing campaigns, viral content, and third-party integrations cause sudden spikes. Deployments consume headroom (new workers booting, caches warming). Without safety margins, any unexpected event pushes the system past capacity. The margin size should match the criticality of the service and the availability of auto-scaling to absorb spikes dynamically.
---
Bad Example:
```bash
# No safety margin — any spike causes saturation
required_workers = 100  # Zero headroom — 101 requests causes queuing
```

Good Example:
```bash
# 1.5x safety margin for critical service
required_workers = 100 × 1.5 = 150  # 50% headroom for spikes and deployments
```
---
Exceptions: Cost-optimized non-critical services with auto-scaling may use smaller margins (1.1-1.2x).
---
Consequences Of Violation: Performance degradation from unexpected traffic spikes, deployment-related capacity pressure, emergency overrides to add capacity.

## Calculate 6-month forecasts with monthly review cadence
---
Category: Maintainability
---
Project capacity needs 6 months forward using current growth rate, and review the forecast against actual traffic every month to adjust projections.
---
Reason: Traffic growth rates change as the product, marketing, and user base evolve. A 6-month forecast made in January will be inaccurate by April if the growth rate changes. Monthly reviews catch divergence early, allowing procurement and infrastructure changes before the system approaches saturation. The 6-month window provides adequate lead time for hardware procurement, contract negotiations, and infrastructure changes.
---
Bad Example:
```bash
# One-time forecast, never revisited
# Forecast in January: 2000 RPS by July
# Actual growth doubles — by April, system is at 1800 RPS and saturated
```

Good Example:
```bash
# Monthly review cadence
# Jan forecast: 2000 RPS by July (8% growth)
# April actual: 1500 RPS (12% growth) — revised: 2200 RPS by July
# May order additional capacity — available before July peak
```
---
Exceptions: Services with flat or declining traffic may extend reviews to quarterly.
---
Consequences Of Violation: Stale forecasts miss accelerating growth, capacity orders placed too late, system saturation during peak season.

## Budget database connections alongside compute resources in capacity plans
---
Category: Architecture
---
Include database connection limits (max_connections × safety factor) as a primary constraint in every capacity plan — never plan compute capacity without calculating the corresponding database connection budget.
---
Reason: Adding application workers increases database connection consumption proportionally (each worker holds persistent connections in Octane or concurrent connections in FPM). Database max_connections is often the binding constraint before CPU or memory are exhausted. A capacity plan that adds 20 workers without checking that the database has 40 available connections will fail with connection refused errors under load.
---
Bad Example:
```bash
# Compute-only capacity plan — ignores database connections
# Adding 20 Octane workers × 2 connections each = 40 new DB connections
# Database max_connections = 100, currently at 80 — overflow!
```

Good Example:
```bash
# Full capacity plan including database
# 20 new workers × 2 connections = 40 connections needed
# Database max_connections = 100, currently at 60
# Can support: (100 × 0.8 - 60) / 2 = 10 new workers max
# Plan shows workers capped at 10 unless DB connection limit increased
```
---
Exceptions: Applications using connection poolers (PgBouncer, ProxySQL) that decouple worker count from database connections may relax this constraint.
---
Consequences Of Violation: Database connection exhaustion, connection refused errors, cascading application failures, blocked administrative access to the database.

## Model expected, best, and worst case growth scenarios
---
Category: Scalability
---
Create three growth projections — best case (current growth continues), expected case (growth slows 50%), worst case (growth doubles) — and plan procurement for the expected case with budget approved for worst case.
---
Reason: A single growth projection is almost always wrong — growth can accelerate or decelerate unpredictably. The expected case drives the procurement timeline and budget request. The worst case ensures the organization has pre-approved budget and a faster procurement path if growth accelerates. The best case provides a lower bound for minimum commitments.
---
Bad Example:
```bash
# Single scenario — always wrong
# Projected: 2000 RPS in 6 months (8% growth)
# Actual: 3000 RPS (15% growth) — no plan, no budget, emergency scramble
```

Good Example:
```bash
# Three scenarios
# Best: 1500 RPS (5% growth) — minimal capacity needed
# Expected: 2000 RPS (8% growth) — plan and budget for this
# Worst: 4000 RPS (15% growth) — pre-approved budget, faster procurement
```
---
Exceptions: Cost-optimized services with flat traffic and long procurement lead times may need only the expected scenario.
---
Consequences Of Violation: No buffer for growth acceleration, emergency procurement under pressure, extended period of degraded performance during capacity gaps.
