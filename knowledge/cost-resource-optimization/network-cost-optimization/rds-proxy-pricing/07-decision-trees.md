# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 08-network-cost-optimization
**Knowledge Unit:** RDS Proxy Pricing
**Generated:** 2026-06-03

---

# Decision Inventory

1. Cost Optimization Strategy Selection
2. Resource Right-Sizing Decision
3. Commitment Discount Purchase Decision

---

# Architecture-Level Decision Trees

---

## Decision Name: Cost Optimization Strategy Selection

---

## Decision Context

Choose the most appropriate cost optimization strategy for this specific area.

---

## Decision Criteria

cost, performance, complexity

---

## Decision Tree

Current monthly spend?

< /month -> Simple config changes
-/month -> Implement standard best practices
-/month -> Model each optimization option
> /month -> Implement all applicable optimizations

Optimization complexity?
Config change -> Implement immediately (highest ROI)
Architecture change -> Plan and schedule
Requires third-party -> Coordinate dependencies

Performance impact?
No impact or improves -> Implement immediately
May degrade -> Test in staging first

Risk level?
Low -> Implement and move on
Medium -> Validate with monitoring before/after
High -> Create rollback plan before implementation

---

## Rationale

Cost optimization should be prioritized by ROI. Configuration changes with no performance impact and high savings should be implemented immediately.

---

## Recommended Default

**Default:** Start with config changes (highest ROI); validate with monitoring; create rollback plans for high-risk changes

---

## Risks Of Wrong Choice

Implementing high-risk changes without testing can cause production incidents costing more than the optimization saves.

---

## Related Rules

Rule: Follow standardized RDS Proxy Pricing practices

---

## Related Skills

Analyze and Optimize RDS Proxy Pricing

---

---

## Decision Name: Resource Right-Sizing Decision

---

## Decision Context

Determine optimal resource allocation from actual usage patterns.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Current P95 utilization (2 weeks)?

< 30% -> Downsize one tier
30-60% -> Appropriate sizing
60-80% -> Plan for scaling
> 80% -> Up-size or scale out

Growth trajectory?
Stable -> Right-size to current needs
Growing < 10%/month -> Add 3-month buffer
Growing > 10%/month -> Add 6-month buffer

Commitment options?
1-year -> ~40% discount
3-year -> ~60% discount
None -> Maximum flexibility

Auto-scaling available?
YES -> Size for baseline; auto-scaling handles peaks
NO -> Size for P95 + 20% headroom

---

## Rationale

Right-sizing eliminates 30-50% waste from over-provisioned resources. Two-week monitoring reveals true baseline and peak usage.

---

## Recommended Default

**Default:** Monitor 2 weeks; right-size to P95 + 20%; use commitment discounts for stable workloads

---

## Risks Of Wrong Choice

Sizing for peak without auto-scaling wastes 40-70% of resource budget.

---

## Related Rules

Rule: Follow standardized RDS Proxy Pricing practices

---

## Related Skills

Analyze and Optimize RDS Proxy Pricing

---

---

## Decision Name: Commitment Discount Purchase Decision

---

## Decision Context

Determine whether to buy Reserved Instances or Savings Plans.

---

## Decision Criteria

cost, flexibility

---

## Decision Tree

Workload runs 24/7?

YES -> Eligible for commitments
NO (dev/staging) -> On-demand better

Workload stability?
Stable, predictable -> 3-year (max savings)
Growing/changing -> 1-year or Compute Savings Plans
Uncertain -> On-demand or no-upfront plans

Payment preference?
All upfront -> Max discount, higher cash outlay
Partial upfront -> Good balance
No upfront -> Lower savings, no capital

Flexibility needed?
Instance type may change -> Compute Savings Plans
Region may change -> Compute Savings Plans
Everything fixed -> Reserved Instances (highest discount)

---

## Rationale

Commitment discounts reduce compute costs by up to 66%. Compute Savings Plans offer flexibility across instances and services.

---

## Recommended Default

**Default:** 3-year Compute Savings Plans for flexibility; RIs for completely fixed instance types

---

## Risks Of Wrong Choice

Buying 3-year RIs for resources that get downsized = paying for unused capacity. No commitment = paying 60% more.

---

## Related Rules

Rule: Follow standardized RDS Proxy Pricing practices

---

## Related Skills

Analyze and Optimize RDS Proxy Pricing

---

