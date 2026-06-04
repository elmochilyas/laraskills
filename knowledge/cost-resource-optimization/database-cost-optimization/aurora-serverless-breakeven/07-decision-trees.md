# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Aurora Serverless v2 Breakeven
**Generated:** 2026-06-03

---

# Decision Inventory

1. Serverless v2 vs Provisioned Decision
2. Serverless v2 ACU Configuration

---

# Architecture-Level Decision Trees

---

## Decision Name: Serverless v2 vs Provisioned Decision

---

## Decision Context

Choose between Serverless v2 and provisioned Aurora based on traffic variability.

---

## Decision Criteria

cost

---

## Decision Tree

Peak-to-trough ratio (90 days)?

< 2:1 -> Provisioned + RI wins (20-60% cheaper)
2:1-5:1 -> Model both options
> 5:1 -> Serverless v2 wins

RI coverage?
3-year RI -> Provisioned 60% cheaper per compute-hour
On-Demand -> Provisioned ~.26 vs Serverless .12/ACU-hour

Min ACU acceptable?
YES -> Serverless v2 floor ~/month at 0.5 ACU
Need true zero -> Provisioned can be stopped

Hybrid considered?
Provisioned writer + Serverless readers -> Often optimal for 2:1-5:1

---

## Rationale

3:1 rule of thumb is for on-demand. With RIs, provisioned is 60% cheaper, requiring ~5:1 ratio for Serverless v2 to compete.

---

## Recommended Default

**Default:** Provisioned + RI for < 2:1; Hybrid for 2:1-5:1; Serverless v2 for > 5:1

---

## Risks Of Wrong Choice

Serverless v2 for steady workloads (<2:1) costs 20-60% more than provisioned + RI.

---

## Related Rules

Rule: Follow standardized Aurora Serverless v2 Breakeven practices

---

## Related Skills

Analyze and Optimize Aurora Serverless v2 Breakeven

---

---

## Decision Name: Serverless v2 ACU Configuration

---

## Decision Context

Set optimal min/max ACU for Aurora Serverless v2.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Production database?

YES -> Min ACU = working_set_GB / 2 (minimum 4 ACU)
NO (dev/test) -> Min ACU = 0 (auto-pause)

Working set known?
YES -> Min ACU = working_set / 2
NO -> Start 4 ACU, monitor buffer pool hit ratio

Buffer pool hit ratio > 95%?
YES -> Min ACU sufficient
NO -> Increase until >95%

Max ACU?
Set at peak + 20% headroom (prevents unbounded cost)

---

## Rationale

Setting min ACU too low (0.5) causes buffer pool thrashing, increasing I/O costs by 50-200%. Each ACU provides ~2GB buffer pool.

---

## Recommended Default

**Default:** Production: min 4 ACU; Dev: min 0 (auto-pause); max = peak + 20%; monitor buffer pool hit ratio

---

## Risks Of Wrong Choice

Setting min ACU to 0.5 in production causes thrashing with 50-200% higher I/O costs.

---

## Related Rules

Rule: Follow standardized Aurora Serverless v2 Breakeven practices

---

## Related Skills

Analyze and Optimize Aurora Serverless v2 Breakeven

---

