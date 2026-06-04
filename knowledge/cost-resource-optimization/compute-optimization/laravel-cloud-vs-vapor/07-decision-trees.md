# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Laravel Cloud vs Vapor Cost Comparison
**Generated:** 2026-06-03

---

# Decision Inventory

1. Cloud vs Vapor Platform Selection
2. Vapor True Cost with Multiplier
3. Vapor to Cloud Migration Decision

---

# Architecture-Level Decision Trees

---

## Decision Name: Cloud vs Vapor Platform Selection

---

## Decision Context

Choose between Laravel Cloud (Fargate) and Vapor (Lambda).

---

## Decision Criteria

cost, performance, complexity

---

## Decision Tree

Monthly request volume?

< 100K req/day -> Cloud Starter (/month)
100K-5M req/day -> Cloud (cost predictability)
> 5M req/day -> Cloud or Forge+EC2

Current platform?
New project -> Cloud (default 2026)
Vapor > /month -> Model migration for 30-50% savings
Vapor < /month -> Stay (migration cost > savings)

Octane compatible?
Tested -> Cloud (Octane default, 3-10x throughput)
Not tested -> Test first; Cloud savings depend on it
Incompatible -> Fix packages or stay

Cold start sensitivity?
Low -> Auto-hibernation fine
High -> Need min containers (reduces savings)

---

## Rationale

Real-world migrations show 30-50% savings Vapor to Cloud. Vapor's 9x multiplier makes it uneconomical above 20M req/month.

---

## Recommended Default

**Default:** Cloud for new projects and Vapor migrations > /month; test Octane first

---

## Risks Of Wrong Choice

Migrating without Octane validation = failed migration or reduced savings.

---

## Related Rules

Rule: Follow standardized Laravel Cloud vs Vapor Cost Comparison practices

---

## Related Skills

Analyze and Optimize Laravel Cloud vs Vapor Cost Comparison

---

---

## Decision Name: Vapor True Cost with Multiplier

---

## Decision Context

Calculate Vapor's true cost including Lambda invocation multiplier.

---

## Decision Criteria

cost

---

## Decision Tree

Measure multiplier?

Divide Lambda invocations by HTTP requests
Average: 9x; Range 4-15x

Apply to calculation:
Effective cost/req = raw Lambda x multiplier
.00000228/req x 9x = .0000205/req

Compare to alternatives:
Cloud: ~.000004/req (5x cheaper)
Bref: .00000228/req (1x, no multiplier)

Add hidden Vapor costs?
API Gateway, CloudFront, NAT Gateway, deployment hooks

---

## Rationale

A single HTTP request on Vapor triggers 9+ Lambda invocations. This multiplier makes Vapor 3-5x more expensive than raw Lambda suggests.

---

## Recommended Default

**Default:** Always factor multiplier into Vapor cost; measure actual from Vapor bill

---

## Risks Of Wrong Choice

Comparing Cloud to raw Lambda (without multiplier) makes Vapor appear 3-5x cheaper than reality.

---

## Related Rules

Rule: Follow standardized Laravel Cloud vs Vapor Cost Comparison practices

---

## Related Skills

Analyze and Optimize Laravel Cloud vs Vapor Cost Comparison

---

---

## Decision Name: Vapor to Cloud Migration Decision

---

## Decision Context

Determine when to migrate from Vapor to Cloud.

---

## Decision Criteria

cost, risk

---

## Decision Tree

Current Vapor spend?

< /month -> Migration not worth effort
- -> Model; payback 6-12 months
- -> Strong candidate; payback 3-6 months
>  -> Urgent; migrate ASAP

Readiness checklist:
Octane validated? Cloud account ready? Rollback prepared?

Approach:
Phased (staging -> prod) -> Lower risk
Rip-and-replace -> Higher risk

Post-migration:
Monitor cost vs baseline 30 days
Right-size containers after 2 weeks
Tune auto-scaling

---

## Rationale

Migration payback typically 3-6 months for apps > /month Vapor. Risk low with rollback option.

---

## Recommended Default

**Default:** Validate Octane; migrate staging; 48h monitor; production with 2-week Vapor rollback

---

## Risks Of Wrong Choice

Rip-and-replace with no rollback = extended downtime if issues arise.

---

## Related Rules

Rule: Follow standardized Laravel Cloud vs Vapor Cost Comparison practices

---

## Related Skills

Analyze and Optimize Laravel Cloud vs Vapor Cost Comparison

---

