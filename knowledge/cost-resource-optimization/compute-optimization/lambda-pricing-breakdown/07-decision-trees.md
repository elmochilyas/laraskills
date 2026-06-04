# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Lambda Pricing Breakdown
**Generated:** 2026-06-03

---

# Decision Inventory

1. Lambda Memory Right-Sizing
2. Lambda vs Fargate Compute Model
3. Provisioned Concurrency Decision

---

# Architecture-Level Decision Trees

---

## Decision Name: Lambda Memory Right-Sizing

---

## Decision Context

Find cost-optimal Lambda memory allocation for each function.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Test at multiple memory levels:

128MB -> Cheapest per-second, slowest
256MB -> Good for simple API functions
512MB -> Standard for Laravel/Bref
1024MB -> Faster, double per-second cost

Calculate cost per invocation:
cost = (mem_GB x duration_s x .0000166667) + .0000002

Pick cheapest meeting SLA?
YES -> Cost-optimal selected
NO -> Paying more than needed

ARM enabled?
YES -> ~34% lower duration cost
NO -> Enable ARM for immediate savings

---

## Rationale

Higher memory costs more per second but may reduce duration. The cost-optimal point is rarely the lowest or highest memory setting.

---

## Recommended Default

**Default:** 256MB for simple functions, 512MB for Laravel/Bref; test and compute cost per invocation

---

## Risks Of Wrong Choice

Over-allocating to 1024MB for simple functions costs 4x more with no duration benefit.

---

## Related Rules

Rule: Follow standardized Lambda Pricing Breakdown practices

---

## Related Skills

Analyze and Optimize Lambda Pricing Breakdown

---

---

## Decision Name: Lambda vs Fargate Compute Model

---

## Decision Context

Choose between Lambda and Fargate based on workload volume and duration.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Monthly request volume?

< 5M req/month -> Lambda (scale-to-zero)
5-30M req/month -> Model both (breakeven zone)
> 30M req/month -> Fargate cheaper (256MB/500ms)

Execution duration?
< 100ms -> Lambda efficient
100-500ms -> Standard breakeven range
> 1s -> Lambda expensive; prefer Fargate

Traffic pattern?
Spiky with idle -> Lambda (scale-to-zero)
Steady 24/7 -> Fargate (flat-rate wins)

Cold starts OK?
YES -> Lambda without Provisioned Concurrency
NO -> +PC adds cost; may push to EC2

---

## Rationale

Lambda's scale-to-zero eliminates idle compute cost. For steady traffic, Fargate's flat-rate pricing is 30-60% cheaper.

---

## Recommended Default

**Default:** Lambda for <5M req/month; Fargate for 5-50M; EC2 for >50M

---

## Risks Of Wrong Choice

Lambda for steady high-volume costs 2-3x more than Fargate.

---

## Related Rules

Rule: Follow standardized Lambda Pricing Breakdown practices

---

## Related Skills

Analyze and Optimize Lambda Pricing Breakdown

---

---

## Decision Name: Provisioned Concurrency Decision

---

## Decision Context

Determine if Provisioned Concurrency is cost-justified vs EC2.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Cold start acceptable?

YES (>200ms) -> No PC needed
NO (<100ms) -> Evaluate PC

Consistent traffic baseline?
YES -> PC may be cost-effective
NO -> PC charges for idle capacity

Cost comparison:
10 provisioned 1GB functions = ~/month
1 t4g.small EC2 = ~/month (always-on)

If PC cost > EC2?
YES -> Use EC2/Fargate instead
NO -> PC acceptable

---

## Rationale

Provisioned Concurrency charges even when not invoked. /month can buy a t4g.small running 24/7.

---

## Recommended Default

**Default:** Avoid PC as default; use EC2/Fargate if consistent sub-100ms latency required

---

## Risks Of Wrong Choice

Enabling PC adds +/month baseline that may exceed EC2 alternative.

---

## Related Rules

Rule: Follow standardized Lambda Pricing Breakdown practices

---

## Related Skills

Analyze and Optimize Lambda Pricing Breakdown

---

