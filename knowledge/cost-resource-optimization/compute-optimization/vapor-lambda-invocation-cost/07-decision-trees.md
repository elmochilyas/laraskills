# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Vapor Lambda Invocation Multiplier
**Generated:** 2026-06-03

---

# Decision Inventory

1. Vapor Lambda Multiplier Calculation
2. Vapor vs Bref Direct Lambda

---

# Architecture-Level Decision Trees

---

## Decision Name: Vapor Lambda Multiplier Calculation

---

## Decision Context

Calculate Vapor's true per-request cost including invocation multiplier.

---

## Decision Criteria

cost

---

## Decision Tree

Measure multiplier?

Divide Lambda invocations by HTTP requests
Average: 9x; Range 4-15x

Apply to cost:
Effective cost/req = raw Lambda x multiplier

Compare:
Vapor: .0000205/req (9x)
Cloud: ~.000004/req (5x cheaper)
Bref: .00000228/req (1x)

Decision > .00005/req?
YES -> Cloud or Bref cheaper
NO -> Vapor competitive

---

## Rationale

Vapor's 9x multiplier makes effective cost 9x raw Lambda. Primary reason Vapor becomes uneconomical above 20M req/month.

---

## Recommended Default

**Default:** Always factor measured multiplier; re-measure quarterly as architecture evolves

---

## Risks Of Wrong Choice

Comparing without multiplier makes Vapor appear 3-5x cheaper than reality.

---

## Related Rules

Rule: Follow standardized Vapor Lambda Invocation Multiplier practices

---

## Related Skills

Analyze and Optimize Vapor Lambda Invocation Multiplier

---

---

## Decision Name: Vapor vs Bref Direct Lambda

---

## Decision Context

Choose between Vapor and Bref for Lambda-native Laravel.

---

## Decision Criteria

cost, complexity

---

## Decision Tree

Request volume?

< 5M req/month -> Vapor convenience justified
5-20M -> Evaluate Bref (eliminates 9x multiplier)
> 20M -> Cloud/Fargate likely cheapest

DevOps capacity?
Limited -> Vapor (managed, zero ops)
Adequate -> Bref (more control, 1x multiplier)
Experienced -> Custom Lambda deployment

Multiplier impact:
Vapor: 9x; Bref: 1x (90% reduction)

Migration path?
Vapor -> Bref -> Cloud for gradual optimization

---

## Rationale

Bref gives direct Lambda without Vapor's architectural overhead. Each request = 1 invocation vs 9+ on Vapor.

---

## Recommended Default

**Default:** Vapor for convenience < 5M req/month; Bref for cost > 5M; Cloud as ultimate destination

---

## Risks Of Wrong Choice

Vapor's 9x multiplier at 20M+ creates +/month bills Bref would reduce by 80%.

---

## Related Rules

Rule: Follow standardized Vapor Lambda Invocation Multiplier practices

---

## Related Skills

Analyze and Optimize Vapor Lambda Invocation Multiplier

---

