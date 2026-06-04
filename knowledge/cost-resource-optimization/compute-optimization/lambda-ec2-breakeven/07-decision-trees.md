# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Lambda vs EC2 Breakeven Analysis
**Generated:** 2026-06-03

---

# Decision Inventory

1. Breakeven Point Calculation
2. Hidden Cost Factor Inclusion
3. Hybrid Lambda + EC2 Architecture

---

# Architecture-Level Decision Trees

---

## Decision Name: Breakeven Point Calculation

---

## Decision Context

Calculate Lambda vs EC2 breakeven for your specific workload metrics.

---

## Decision Criteria

cost

---

## Decision Tree

Gather 30-day metrics:

Monthly request count
Avg memory per function (MB)
Avg execution duration (ms)

Calculate Lambda cost:
requests x .0000002 + (requests x mem_GB x duration_h x .0000166667)

Calculate EC2 cost:
instances_needed x instance_rate x 730 hours

Compare:
Lambda cheaper -> Use Lambda (below breakeven)
EC2 cheaper -> Use EC2/Fargate (above breakeven)
Similar -> Fargate as middle ground

---

## Rationale

Breakeven shifts dramatically with memory and duration. 512MB/1s function breakeven is ~7.5M requests, not 30M. Model with your actual metrics.

---

## Recommended Default

**Default:** Model with 30-day actual metrics; re-evaluate quarterly

---

## Risks Of Wrong Choice

Using reference profile instead of actual gives breakeven wrong by 2-4x.

---

## Related Rules

Rule: Follow standardized Lambda vs EC2 Breakeven Analysis practices

---

## Related Skills

Analyze and Optimize Lambda vs EC2 Breakeven Analysis

---

---

## Decision Name: Hidden Cost Factor Inclusion

---

## Decision Context

Include VPC, PC, and ops overhead in Lambda vs EC2 comparison.

---

## Decision Criteria

cost

---

## Decision Tree

Lambda in VPC?

YES -> Add NAT Gateway (/month + .045/GB)
NO -> No networking cost

PC needed?
YES -> Add PC cost to Lambda
NO -> No PC baseline

Ops overhead?
EC2: 5-10 hours/month (-1000 value)
Fargate: Reduced overhead
Lambda: Zero operations

Savings Plans?
Factor 17% Lambda discount or up to 66% EC2 discount
No commitment -> Use on-demand pricing

---

## Rationale

TCO includes hidden costs shifting breakeven by 20-50%. VPC networking alone adds -200/month to Lambda.

---

## Recommended Default

**Default:** Include all hidden costs + ops overhead in TCO comparison

---

## Risks Of Wrong Choice

Comparing only compute line items underestimates Lambda true cost by 20-50%.

---

## Related Rules

Rule: Follow standardized Lambda vs EC2 Breakeven Analysis practices

---

## Related Skills

Analyze and Optimize Lambda vs EC2 Breakeven Analysis

---

---

## Decision Name: Hybrid Lambda + EC2 Architecture

---

## Decision Context

Design hybrid using EC2 baseline + Lambda overflow.

---

## Decision Criteria

cost, performance, complexity

---

## Decision Tree

Baseline steady?

YES -> EC2 baseline (RIs for discount)
NO -> Lambda for all (scale-to-zero)

Spikes significant (>2x)?
YES -> Lambda handles overflow (no idle capacity)
NO -> EC2 alone with Auto Scaling

Complexity acceptable?
YES -> Hybrid: EC2 + Lambda overflow
NO -> Single platform simpler

Monthly compute spend?
>  -> Hybrid complexity may be worth it
<  -> Single platform simpler

---

## Rationale

Hybrid uses EC2 for steady baseline and Lambda for spikes. Most cost-efficient but operationally complex.

---

## Recommended Default

**Default:** Single platform (Fargate) for most apps < /month; hybrid only for clear baseline/spike separation

---

## Risks Of Wrong Choice

Hybrid complexity often negates savings under /month.

---

## Related Rules

Rule: Follow standardized Lambda vs EC2 Breakeven Analysis practices

---

## Related Skills

Analyze and Optimize Lambda vs EC2 Breakeven Analysis

---

