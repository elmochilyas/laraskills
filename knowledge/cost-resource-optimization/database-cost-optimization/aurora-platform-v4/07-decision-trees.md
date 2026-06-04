# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Aurora Platform v4
**Generated:** 2026-06-03

---

# Decision Inventory

1. Aurora v4 Upgrade Decision
2. Post-v4 Instance Rightsizing

---

# Architecture-Level Decision Trees

---

## Decision Name: Aurora v4 Upgrade Decision

---

## Decision Context

Decide when to upgrade Aurora v3 to v4 for immediate cost reduction.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Currently on Aurora?

YES -> Upgrade to v4 immediately (28% cost reduction, free)
NO -> Not applicable

v4 available in region?
YES -> Proceed with upgrade
NO -> Wait for regional availability

Upgrade approach?
During maintenance window -> <30s downtime
Immediate -> If >30 days to next window

Post-upgrade:
Evaluate downsizing after 2 weeks (27% faster queries may allow smaller instance)

---

## Rationale

v4 delivers 28% cost reduction and 27% faster queries as a free, backward-compatible upgrade. No downside.

---

## Recommended Default

**Default:** Upgrade immediately during next maintenance window; combine with Graviton for ~42% total savings

---

## Risks Of Wrong Choice

Delaying pays 28% more each month with zero benefit.

---

## Related Rules

Rule: Follow standardized Aurora Platform v4 practices

---

## Related Skills

Analyze and Optimize Aurora Platform v4

---

---

## Decision Name: Post-v4 Instance Rightsizing

---

## Decision Context

Determine if Aurora instance can be downsized after v4 upgrade.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Current CPU utilization?

< 60% -> Strong downsizing candidate
60-80% -> May downsize; monitor carefully
> 80% -> Keep current size

Monitor 2 weeks post-upgrade?
YES -> Collect CPU, memory, IOPS metrics
NO -> Risky; wait for data

Downsize trial results?
CPU < 70% -> Keep smaller instance
CPU > 80% -> Revert to original

Combine with Graviton?
YES -> v4 (28%) + Graviton (20%) = ~42% total reduction
NO -> v4 only (28%)

---

## Rationale

v4's 27% performance improvement may allow the same throughput on a smaller instance. Combined with Graviton, ~42% total reduction.

---

## Recommended Default

**Default:** Monitor 2 weeks post-upgrade; evaluate downsizing one tier; combine with Graviton

---

## Risks Of Wrong Choice

Downsizing without 2 weeks monitoring risks insufficient capacity during peak hours.

---

## Related Rules

Rule: Follow standardized Aurora Platform v4 practices

---

## Related Skills

Analyze and Optimize Aurora Platform v4

---

