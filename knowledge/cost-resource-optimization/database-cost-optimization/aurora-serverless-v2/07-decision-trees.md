# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Aurora Serverless v2 Pricing
**Generated:** 2026-06-03

---

# Decision Inventory

1. Serverless v2 Configuration Strategy
2. I/O-Optimized vs Standard

---

# Architecture-Level Decision Trees

---

## Decision Name: Serverless v2 Configuration Strategy

---

## Decision Context

Configure ACU range and settings for optimal cost-performance.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Environment?

Production -> Min 4 ACU, max = peak + 20%
Dev/test -> Min 0 ACU (auto-pause), max 2-4 ACU

I/O vs compute balance?
I/O > 25% of compute -> I/O-Optimized (.156/ACU-hour)
I/O < 25% -> Standard (.12/ACU-hour)

Buffer pool hit ratio?
> 95% = min ACU adequate
< 95% = increase min ACU

RDS Proxy?
Factor 8 ACU minimum charge (~/month)
Use PgBouncer for significant savings

---

## Rationale

Serverless v2 has no RI, making it optimal for variable workloads but more expensive for steady workloads than provisioned+RI.

---

## Recommended Default

**Default:** Production: min 4 ACU, I/O-Optimized if I/O > 25%; Dev: min 0 ACU, auto-pause

---

## Risks Of Wrong Choice

Min ACU 0.5 in production = buffer pool thrashing, 50-200% higher I/O costs.

---

## Related Rules

Rule: Follow standardized Aurora Serverless v2 Pricing practices

---

## Related Skills

Analyze and Optimize Aurora Serverless v2 Pricing

---

---

## Decision Name: I/O-Optimized vs Standard

---

## Decision Context

Choose between Standard and I/O-Optimized configurations.

---

## Decision Criteria

cost

---

## Decision Tree

I/O charges as % of compute?

< 15% -> Standard (.12/ACU-hour + I/O charges)
15-25% -> Model both (breakeven zone)
> 25% -> I/O-Optimized (.156/ACU-hour, no I/O charges)

Workload profile?
Read-heavy, frequent queries -> Higher I/O; favor I/O-Optimized
Write-heavy -> Evaluate ratio
Buffer pool thrashing -> Fix min ACU first

Switch possible?
YES -> Zero downtime; start Standard, switch when threshold crossed

---

## Rationale

I/O-Optimized eliminates per-I/O charges at 30% higher compute. Breakeven when I/O > ~25% of compute.

---

## Recommended Default

**Default:** Start Standard; monitor I/O cost ratio; switch to I/O-Optimized when I/O > 25% of compute

---

## Risks Of Wrong Choice

Not evaluating I/O-Optimized when I/O high = paying 2-3x more in I/O than necessary.

---

## Related Rules

Rule: Follow standardized Aurora Serverless v2 Pricing practices

---

## Related Skills

Analyze and Optimize Aurora Serverless v2 Pricing

---

